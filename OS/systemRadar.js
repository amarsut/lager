// systemRadar.js - Fristående modul för Systemradarn (Smart Caching & Persistent UI)

// ==========================================
// NY HUVUDMOTOR FÖR ATT STARTA SÖKNINGAR SÄKERT
// ==========================================
window.osSearchVehicle = async (regnr, targetType = 'SMART_SEARCH') => {
    if (!regnr || !window.db) return;
    const cleanReg = regnr.toUpperCase().trim();

    try {
        // 1. Kolla cachen först (asynkront, tar bara några millisekunder om man är online)
        const doc = await window.db.collection('vehicleSpecs').doc(cleanReg).get();
        const cachedData = doc.exists ? doc.data() : null;

        // 2. Logik: Behöver vi verkligen skrapa?
        let needsScrape = false;
        let finalTarget = targetType;

        if (!cachedData) {
            needsScrape = true;
            // ÄNDRING: Prio 1 är nu Oljemagasinet!
            if (targetType === 'SMART_SEARCH') finalTarget = 'START_OS_RADAR'; 
        } else {
            if (targetType === 'SMART_SEARCH') {
                // Har vi någon data alls? Nöj oss med den! Inga onödiga sökningar.
                needsScrape = false;
            } else if (targetType === 'START_OS_RADAR' && !cachedData.oil) {
                needsScrape = true;
            } else if (targetType === 'START_TS_RADAR' && !cachedData.ts_status) {
                needsScrape = true;
            } else if (targetType === 'START_CARINFO' && (!cachedData.model || !cachedData.vin)) {
                needsScrape = true;
            }
        }

        // 3A. DATAN FINNS REDAN -> Inget popup-blink, visa datan direkt!
        if (!needsScrape) {
            window.dispatchEvent(new CustomEvent('show-system-radar', { 
                detail: { regnr: cleanReg, forceShowData: cachedData }
            }));
            return;
        }

        // 3B. DATAN SAKNAS ELLER ÄR OFULLSTÄNDIG -> Nu öppnar vi fönstret och skrapar!
        let url = '';
        if (finalTarget === 'START_OS_RADAR') url = 'https://www.oljemagasinet.se/';
        if (finalTarget === 'START_TS_RADAR') url = 'https://fordon-fu-regnr.transportstyrelsen.se/';
        if (finalTarget === 'START_CARINFO') url = `https://www.car.info/sv-se/license-plate/S/${cleanReg}#bmg_export`;

        // Öppnar sökfönstret (Chrome tillåter detta inom 1000ms från ett klick även inuti en async funktion)
        const popup = window.open(url, 'VehicleRadarPopup', 'width=450,height=550,left=9999,top=9999');
        
        if (!popup) {
            console.warn("Webbläsaren blockerade popup-fönstret.");
            // Valfritt: Alert till användaren att tillåta popups
        }

        // --- MAGIN: Visa radarn som "Laddar...", och skicka med ev. gammal data ---
        window.dispatchEvent(new CustomEvent('show-system-radar', { 
            detail: { 
                regnr: cleanReg, 
                waitForExtension: true, 
                actionTrigger: finalTarget,
                partialData: cachedData
            }
        }));

        // Pings för att kickstarta skrapan
        let pings = 0;
        const pingInterval = setInterval(() => {
            if (popup && !popup.closed) {
                popup.postMessage({ action: finalTarget, regnr: cleanReg }, '*');
            } else {
                clearInterval(pingInterval);
            }
            pings++;
            if (pings > 600) clearInterval(pingInterval);
        }, 500);

    } catch (err) {
        console.error("Fel vid cache-koll:", err);
    }
};


window.GlobalSystemRadar = ({ isChatOpen, navigateTo }) => {
    const { useState, useEffect } = React;
    
    const [radars, setRadars] = useState(() => {
        try {
            const saved = localStorage.getItem('os_active_radars');
            return saved ? JSON.parse(saved) : [];
        } catch(e) { return []; }
    });
    const [copiedVins, setCopiedVins] = useState({});

    useEffect(() => {
        localStorage.setItem('os_active_radars', JSON.stringify(radars));
    }, [radars]);

    useEffect(() => {
        const handleTrigger = (e) => {
            const { regnr, forceShowData, waitForExtension, actionTrigger, partialData } = e.detail;
            if (!regnr) return;

            // Scenario A: Vi har redan all data, visa bara rutan.
            if (forceShowData) {
                setRadars(prev => {
                    const existing = prev.find(r => r.regnr === regnr);
                    if (existing) return prev.map(r => r.regnr === regnr ? { ...r, status: 'success', data: forceShowData, isMinimized: false } : r);
                    return [...prev, { regnr, status: 'success', data: forceShowData, isMinimized: false }];
                });
                return;
            }

            // Scenario B: Vi söker efter ny data, men behåller eventuell känd data under tiden!
            setRadars(prev => {
                const existing = prev.find(r => r.regnr === regnr);
                const mergedData = existing ? { ...(existing.data || {}), ...(partialData || {}) } : (partialData || null);
                
                if (existing) {
                    return prev.map(r => r.regnr === regnr ? { ...r, status: 'loading', data: mergedData, isMinimized: false, actionTrigger } : r);
                }
                return [...prev, { regnr, status: 'loading', data: mergedData, isMinimized: false, actionTrigger }];
            });

            if (waitForExtension) {
                if (window[`timeout_${regnr}`]) clearTimeout(window[`timeout_${regnr}`]);
                window[`timeout_${regnr}`] = setTimeout(() => {
                    setRadars(prev => prev.map(r => {
                        if (r.regnr === regnr && r.status === 'loading') {
                            // Om vi timear ut, men har data att visa ändå, ge den 'success' så vi inte förlorar infon!
                            if (r.data && Object.keys(r.data).length > 0) return { ...r, status: 'success' };
                            return { ...r, status: 'not_found' };
                        }
                        return r;
                    }));
                }, 60000); // 60s Loading timeout
            }
        };

        const handleMessage = async (event) => {
            const fordonData = event.data;
            if (!fordonData || !['Car.info_Extension', 'Oljemagasinet_Extension', 'Transportstyrelsen_Extension'].includes(fordonData.source)) return;

            let parsedModel = fordonData.bilmodell || "";
            if (!parsedModel && fordonData.fabrikat && fordonData.fabrikat !== 'SAKNAS') {
                parsedModel = `${fordonData.fabrikat} ${fordonData.handelsbeteckning && fordonData.handelsbeteckning !== 'SAKNAS' ? fordonData.handelsbeteckning : ''}`.trim();
            }

            // HÄR ÄR ÄNDRINGEN: Vi sparar ALL extra data via ...fordonData
            const data = {
                ...fordonData, 
                oil: fordonData.oljevolym ? `${fordonData.oljevolym.replace(/[^0-9.,]/g, '')} l` : '',
                engine: fordonData.motorkod || '', 
                year: fordonData.årsmodell || fordonData.fordonsår || '',
                mileage: fordonData.miltal || fordonData.mätarställning || '',
                vin: fordonData.vin || fordonData.chassinummer || '',
                model: parsedModel,
                ts_status: fordonData.fordonsstatus || '',
                ts_forbid: fordonData.användningsförbud || '',
                ts_inspection: fordonData.besiktning_senast || '',
                ts_gearbox: fordonData.växellåda || '',
                ts_fuel: fordonData.drivmedel || ''
            };

            // Rensa bort internt skräp
            delete data.source;
            delete data.action;

            const regnr = fordonData.regnr?.toUpperCase();
            if (window[`timeout_${regnr}`]) clearTimeout(window[`timeout_${regnr}`]);

            const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== '' && v !== null && v !== undefined && v !== 'SAKNAS'));

            setRadars(prev => {
                const existing = prev.find(r => r.regnr === regnr);
                if (existing) {
                    return prev.map(r => r.regnr === regnr ? {
                        ...r, status: 'success', data: { ...(r.data || {}), ...cleanData }, isMinimized: false
                    } : r);
                } 
                return [...prev, { regnr, status: 'success', data: cleanData, isMinimized: false }];
            });

            if (regnr && window.db && Object.keys(cleanData).length > 0) {
                cleanData.updatedAt = new Date().toISOString();
                try { await window.db.collection('vehicleSpecs').doc(regnr).set(cleanData, { merge: true }); } catch(e) {}
            }
        };

        window.removeEventListener('show-system-radar', handleTrigger);
        window.removeEventListener('message', handleMessage);
        window.addEventListener('show-system-radar', handleTrigger);
        window.addEventListener('message', handleMessage);
        
        return () => {
            window.removeEventListener('show-system-radar', handleTrigger);
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => { if (window.lucide && radars.length > 0) window.lucide.createIcons(); });

    const handleCopyVin = (regnr, vin) => {
        if (vin) { navigator.clipboard.writeText(vin); setCopiedVins(prev => ({ ...prev, [regnr]: true })); setTimeout(() => setCopiedVins(prev => ({ ...prev, [regnr]: false })), 2000); }
    };

    const setMinimized = (regnr, val) => setRadars(prev => prev.map(r => r.regnr === regnr ? { ...r, isMinimized: val } : r));
    const closeRadar = (regnr) => setRadars(prev => prev.filter(r => r.regnr !== regnr));

    const handleRetry = (radar) => {
        window.osSearchVehicle(radar.regnr, radar.actionTrigger || 'START_OS_RADAR');
    };

    if (radars.length === 0) return null;

    const StatCard = ({ icon, label, val, highlight, focus }) => {
        const displayVal = val || '-';
        
        // Standard (Grön/Diskret)
        let colorClass = 'text-emerald-400/80';
        let hoverClass = 'hover:border-emerald-500/30';
        let bgGlow = 'bg-emerald-500/5 group-hover:bg-emerald-500/10';
        let containerClass = 'bg-[#1e293b]/90 border-white/5';

        if (highlight) {
            // Varning (Röd)
            colorClass = 'text-red-400';
            hoverClass = 'hover:border-red-500/30';
            bgGlow = 'bg-red-500/5 group-hover:bg-red-500/10';
        } else if (focus) {
            // Subtilt Fokus (Orange/Appens Tema)
            colorClass = 'text-orange-400';
            hoverClass = 'hover:border-orange-500/50';
            bgGlow = 'bg-orange-500/10 group-hover:bg-orange-500/20';
            containerClass = 'bg-[#1e293b] border-orange-500/30 shadow-[inset_0_0_15px_rgba(249,115,22,0.08)]';
        }

        return (
            <div className={`${containerClass} border rounded-xl p-3.5 flex flex-col gap-1.5 relative overflow-hidden group transition-colors ${hoverClass}`}>
                <div className={`absolute right-0 top-0 w-16 h-16 blur-xl rounded-full pointer-events-none transition-all ${bgGlow}`}></div>
                <div className={`text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5`}>
                    <window.Icon name={icon} size={10} className={colorClass} /> {label}
                </div>
                <div className={`text-[13px] font-bold truncate ${val ? 'text-white' : 'text-slate-600'}`} title={displayVal}>
                    {displayVal}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* NYTT: Backdrop för att kunna klicka utanför och minimera radarn */}
            {radars.some(r => !r.isMinimized) && (
                <div 
                    className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none transition-all duration-300 pointer-events-auto"
                    onClick={() => {
                        // Minimerar alla öppna radar-fönster vid klick utanför
                        setRadars(prev => prev.map(r => ({ ...r, isMinimized: true })));
                    }}
                ></div>
            )}

            {/* Container: Placerad till höger, ovanför bottenmenyn */}
            <div className={`fixed z-[9999] flex flex-col gap-3 pointer-events-none transition-all duration-500 ease-in-out 
                ${isChatOpen ? 'lg:right-[490px]' : 'lg:right-8'} 
                right-3 sm:right-8 
                bottom-[80px] lg:bottom-[112px] 
                items-end`}>
                
                {radars.map(radar => {
                    
                    if (radar.isMinimized) {
                        return (
                            <div key={radar.regnr} className="pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300">
                                <div 
                                    onClick={() => setMinimized(radar.regnr, false)}
                                    className="bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/40 shadow-[0_10px_25px_rgba(0,0,0,0.5),_0_0_15px_rgba(16,185,129,0.2)] rounded-full px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-[#1e293b] hover:border-emerald-400/60 transition-all group"
                                >
                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 leading-none">Systemradar</span>
                                        <span className="text-[12px] font-mono font-bold text-white leading-none mt-1">{radar.regnr}</span>
                                    </div>

                                    <div className="w-px h-6 bg-white/10 mx-1"></div>

                                    <button 
                                        onClick={(e) => { e.stopPropagation(); closeRadar(radar.regnr); }}
                                        className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    >
                                        <window.Icon name="x" size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    const isCopied = copiedVins[radar.regnr];
                    const hasData = radar.data && Object.keys(radar.data).length > 0;
                    const hasTsData = !!radar.data?.ts_status;

                    return (
                        <div key={radar.regnr} className="pointer-events-auto w-[calc(100vw-1.5rem)] sm:w-auto animate-in slide-in-from-bottom-8 sm:slide-in-from-right-8 fade-in zoom-in-95 duration-300">
                            {/* Återställd till en "flytande" ruta (rounded-2xl) istället för bottom-sheet */}
                            <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5),_0_0_30px_rgba(16,185,129,0.15)] rounded-2xl w-full sm:w-[420px] relative overflow-hidden flex flex-col font-sans max-h-[75vh] overflow-y-auto custom-scrollbar">
                                
                                <div className={`absolute top-0 left-0 w-full h-1 transition-colors ${radar.status === 'loading' ? 'bg-orange-500 animate-pulse' : radar.status === 'success' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500'} z-10`}></div>
                                
                                <button 
                                    onClick={() => setMinimized(radar.regnr, true)}
                                    className="absolute top-4 right-12 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                                >
                                    <window.Icon name="minus" size={14} />
                                </button>

                                <button 
                                    onClick={() => closeRadar(radar.regnr)}
                                    className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                                >
                                    <window.Icon name="x" size={14} />
                                </button>

                                <div className="p-4 sm:p-5 pb-5">
                                    <div className="flex items-center gap-4 sm:gap-5 mb-5 mt-1">
                                        <div className="shrink-0 relative flex items-center justify-center">
                                            {radar.status === 'loading' ? (
                                                <>
                                                    <window.Icon name="loader" size={32} className="text-orange-500 animate-spin absolute" />
                                                    <div className="w-6 h-6 bg-orange-500/20 rounded-full animate-pulse"></div>
                                                </>
                                            ) : radar.status === 'success' ? (
                                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                    <window.Icon name="check-circle" size={24} className="text-emerald-400" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/30">
                                                    <window.Icon name="x-circle" size={24} className="text-red-400" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col flex-1 min-w-0 pr-16">
                                            <span className={`text-[9px] font-black uppercase tracking-widest mb-1 drop-shadow-sm ${radar.status === 'loading' ? 'text-orange-500' : radar.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {radar.status === 'loading' ? 'SÖKER...' : radar.status === 'success' ? 'DATA FÅNGAD' : 'SYSTEMRADAR'}
                                            </span>
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="text-xl font-black text-white tracking-wider font-mono uppercase leading-none">{radar.regnr}</h3>
                                            </div>
                                            {radar.data?.model && (radar.status === 'success' || radar.status === 'loading') && (
                                                <p className="text-[11px] text-slate-300 font-bold uppercase truncate mt-1.5 tracking-widest">{radar.data.model}</p>
                                            )}
                                            {radar.status === 'loading' && (
                                                <p className="text-[10px] text-slate-400 font-medium mt-1.5">Etablerar anslutning...</p>
                                            )}
                                        </div>
                                    </div>

                                    {(radar.status === 'success' || radar.status === 'loading') && hasData && (
                                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                {radar.data.oil && <StatCard icon="droplet" label="Oljevolym" val={radar.data.oil} focus={true} />}
                                                {radar.data.engine && <StatCard icon="cpu" label="Motorkod" val={radar.data.engine} focus={true} />}
                                                
                                                {radar.data.year && <StatCard icon="calendar" label="Årsmodell" val={radar.data.year} />}
                                                {radar.data.mileage && <StatCard icon="gauge" label="Miltal" val={radar.data.mileage} />}
                                                
                                                {hasTsData && (
                                                    <>
                                                        <StatCard icon="activity" label="Status" val={radar.data.ts_status} highlight={radar.data.ts_forbid?.toLowerCase().includes('ja')} />
                                                        <StatCard icon="check-circle" label="Besiktigad till" val={radar.data.ts_inspection} />
                                                        <StatCard icon="settings" label="Växellåda" val={radar.data.ts_gearbox} />
                                                        <StatCard icon="zap" label="Drivmedel" val={radar.data.ts_fuel} />
                                                        {radar.data.årsskatt && <StatCard icon="banknote" label="Årsskatt" val={radar.data.årsskatt} />}
                                                        {radar.data.motoreffekt && <StatCard icon="zap" label="Effekt" val={radar.data.motoreffekt} />}
                                                        {radar.data.färg && <StatCard icon="palette" label="Färg" val={radar.data.färg} />}
                                                        {radar.data.import && radar.data.import.toLowerCase() !== 'nej' && <StatCard icon="globe" label="Import" val={radar.data.import} highlight />}
                                                    </>
                                                )}
                                            </div>

                                            <div 
                                                onClick={() => handleCopyVin(radar.regnr, radar.data.vin)}
                                                title="Kopiera Chassinummer"
                                                className={`mt-1 group cursor-pointer border rounded-xl p-3 flex items-center justify-between transition-all duration-300 ${isCopied ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-[#1e293b]/80 border-white/5 hover:border-emerald-500/30'}`}
                                            >
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                                                        <window.Icon name="fingerprint" size={10} className="text-slate-500" /> Chassinummer (VIN)
                                                    </span>
                                                    <span className={`font-mono text-[13px] font-bold tracking-[0.15em] truncate transition-colors ${isCopied ? 'text-emerald-400' : radar.data.vin ? 'text-white group-hover:text-emerald-400' : 'text-slate-600'}`}>
                                                        {radar.data.vin || '-'}
                                                    </span>
                                                </div>
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${isCopied ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105' : radar.data.vin ? 'bg-white/5 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400' : 'bg-transparent text-transparent'}`}>
                                                    {radar.data.vin && <window.Icon name={isCopied ? "check" : "copy"} size={16} />}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-1">
                                                <button 
                                                    onClick={() => {
                                                        if(navigateTo) navigateTo('NEW_JOB', { job: { regnr: radar.data.regnr, bilmodell: radar.data.model, vin: radar.data.vin, miltal: radar.data.mileage?.replace(/\D/g, '') }});
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                                >
                                                    <window.Icon name="file-plus" size={14} /> Arbetsorder
                                                </button>
                                                
                                                {!hasTsData && (
                                                    <button 
                                                        onClick={() => window.osSearchVehicle(radar.regnr, 'START_TS_RADAR')}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                                    >
                                                        <window.Icon name="shield" size={14} /> TS-Data
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {radar.status === 'not_found' && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col gap-3 mt-2">
                                            <div className="flex items-start gap-3">
                                                <window.Icon name="alert-circle" size={18} className="text-red-400 shrink-0 mt-0.5" />
                                                <span className="text-[12px] font-medium text-red-200 leading-relaxed">Systemet kunde inte hitta informationen, eller så blockerades den.</span>
                                            </div>
                                            <button 
                                                onClick={() => handleRetry(radar)}
                                                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-500/30 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2"
                                            >
                                                <window.Icon name="refresh-cw" size={14} /> Försök Igen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
