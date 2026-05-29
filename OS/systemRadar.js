// systemRadar.js - Fristående modul för Systemradarn (Smart Caching & Persistent UI)

// ==========================================
// NY HUVUDMOTOR FÖR ATT STARTA SÖKNINGAR SÄKERT
// ==========================================
window.osSearchVehicle = async (regnr, targetType = 'SMART_SEARCH', forceScrape = false) => {
    if (!regnr || !window.db) return;
    const cleanReg = regnr.toUpperCase().trim();

    try {
        const doc = await window.db.collection('vehicleSpecs').doc(cleanReg).get();
        const cachedData = doc.exists ? doc.data() : null;

        let needsScrape = forceScrape; 
        let finalTarget = targetType;

        if (!cachedData && !forceScrape) {
            needsScrape = true;
            if (targetType === 'SMART_SEARCH') finalTarget = 'START_OS_RADAR'; 
        } else if (!forceScrape) {
            if (targetType === 'SMART_SEARCH') {
                needsScrape = false;
            } else if (targetType === 'START_OS_RADAR' && !cachedData.oil) {
                needsScrape = true;
            } else if (targetType === 'START_TS_RADAR' && !cachedData.ts_status) {
                needsScrape = true;
            } else if (targetType === 'START_CARINFO' && (!cachedData.model || !cachedData.vin)) {
                needsScrape = true;
            }
        }

        if (forceScrape && targetType === 'SMART_SEARCH') finalTarget = 'START_OS_RADAR';

        if (!needsScrape) {
            window.dispatchEvent(new CustomEvent('show-system-radar', { 
                detail: { regnr: cleanReg, forceShowData: cachedData }
            }));
            return;
        }

        let url = '';
        if (finalTarget === 'START_OS_RADAR') url = 'https://www.oljemagasinet.se/';
        if (finalTarget === 'START_TS_RADAR') url = 'https://fordon-fu-regnr.transportstyrelsen.se/';
        if (finalTarget === 'START_CARINFO') url = `https://www.car.info/sv-se/license-plate/S/${cleanReg}#bmg_export`;

        const popup = window.open(url, 'VehicleRadarPopup', 'width=450,height=550,left=9999,top=9999');
        
        window.dispatchEvent(new CustomEvent('show-system-radar', { 
            detail: { 
                regnr: cleanReg, 
                waitForExtension: true, 
                actionTrigger: finalTarget,
                partialData: cachedData 
            }
        }));

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

window.GlobalSystemRadar = ({ isChatOpen }) => {
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

            setRadars(prev => {
                const othersMinimized = prev.map(r => r.regnr !== regnr ? { ...r, isMinimized: true } : r);
                const existing = othersMinimized.find(r => r.regnr === regnr);

                if (forceShowData) {
                    if (existing) return othersMinimized.map(r => r.regnr === regnr ? { ...r, status: 'success', data: forceShowData, isMinimized: false } : r);
                    return [...othersMinimized, { regnr, status: 'success', data: forceShowData, isMinimized: false }];
                }

                const mergedData = existing ? { ...(existing.data || {}), ...(partialData || {}) } : (partialData || null);
                
                if (existing) {
                    return othersMinimized.map(r => r.regnr === regnr ? { ...r, status: 'loading', data: mergedData, isMinimized: false, actionTrigger } : r);
                }
                return [...othersMinimized, { regnr, status: 'loading', data: mergedData, isMinimized: false, actionTrigger }];
            });

            if (waitForExtension) {
                if (window[`timeout_${regnr}`]) clearTimeout(window[`timeout_${regnr}`]);
                window[`timeout_${regnr}`] = setTimeout(() => {
                    setRadars(prev => prev.map(r => {
                        if (r.regnr === regnr && r.status === 'loading') {
                            if (r.data && Object.keys(r.data).length > 0) return { ...r, status: 'success' };
                            return { ...r, status: 'not_found' };
                        }
                        return r;
                    }));
                }, 60000); 
            }
        };

        const handleMessage = async (event) => {
            const fordonData = event.data;
            if (!fordonData || !['Car.info_Extension', 'Oljemagasinet_Extension', 'Transportstyrelsen_Extension'].includes(fordonData.source)) return;

            let parsedModel = fordonData.bilmodell || "";
            if (!parsedModel && fordonData.fabrikat && fordonData.fabrikat !== 'SAKNAS') {
                parsedModel = `${fordonData.fabrikat} ${fordonData.handelsbeteckning && fordonData.handelsbeteckning !== 'SAKNAS' ? fordonData.handelsbeteckning : ''}`.trim();
            }

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

            delete data.source; delete data.action;

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
                return [...prev.map(r => ({...r, isMinimized: true})), { regnr, status: 'success', data: cleanData, isMinimized: false }];
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
        if (vin) { 
            navigator.clipboard.writeText(vin); 
            setCopiedVins(prev => ({ ...prev, [regnr]: true })); 
            setTimeout(() => setCopiedVins(prev => ({ ...prev, [regnr]: false })), 2000); 
        }
    };

    const handleQuickLink = (e, textToCopy, url) => {
        e.stopPropagation();
        if (textToCopy) navigator.clipboard.writeText(textToCopy);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const setMinimized = (regnr, val) => {
        setRadars(prev => prev.map(r => {
            if (r.regnr === regnr) return { ...r, isMinimized: val };
            if (!val) return { ...r, isMinimized: true }; 
            return r;
        }));
    };

    const closeRadar = (regnr) => setRadars(prev => prev.filter(r => r.regnr !== regnr));
    const handleRetry = (radar) => window.osSearchVehicle(radar.regnr, radar.actionTrigger || 'START_OS_RADAR', true);

    if (radars.length === 0) return null;

    // MJUKARE STAT CARD (Graphite Tone)
    const StatCard = ({ icon, label, val, highlight }) => {
        const displayVal = val || '-';
        let colorClass = 'text-emerald-400';
        let borderGlow = 'border-white/5 hover:border-emerald-400/30 hover:bg-emerald-400/5';
        
        if (highlight) {
            colorClass = 'text-red-400';
            borderGlow = 'border-red-400/30 hover:border-red-400/50 bg-red-500/5 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]';
        }

        return (
            <div className={`bg-slate-700/30 backdrop-blur-md rounded-xl p-3.5 flex flex-col gap-1.5 transition-all duration-300 border ${borderGlow} group hover:-translate-y-0.5 shadow-sm hover:shadow-md`}>
                <div className={`text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5`}>
                    <window.Icon name={icon} size={10} className={colorClass} /> {label}
                </div>
                <div className={`text-[13px] font-bold tracking-wide truncate ${val ? 'text-slate-100 group-hover:text-white transition-colors' : 'text-slate-500'}`} title={displayVal}>
                    {displayVal}
                </div>
            </div>
        );
    };

    return (
        <>
            {radars.some(r => !r.isMinimized) && (
                <div 
                    className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none transition-all duration-300 pointer-events-auto"
                    onClick={() => setRadars(prev => prev.map(r => ({ ...r, isMinimized: true })))}
                ></div>
            )}

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
                                    className="bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-lg rounded-full px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-700/95 hover:border-emerald-400/40 transition-all group"
                                >
                                    <span className="relative flex h-2 w-2 shrink-0">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${radar.status === 'loading' ? 'bg-orange-400' : 'bg-emerald-400'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${radar.status === 'loading' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                                    </span>
                                    
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none group-hover:text-emerald-400 transition-colors">RADAR</span>
                                        <span className="text-[12px] font-mono font-bold text-white leading-none mt-1">{radar.regnr}</span>
                                    </div>
                                    <div className="w-px h-5 bg-white/10 mx-1"></div>
                                    <button onClick={(e) => { e.stopPropagation(); closeRadar(radar.regnr); }} className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                        <window.Icon name="x" size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    const isCopied = copiedVins[radar.regnr];
                    const hasData = radar.data && Object.keys(radar.data).length > 0;
                    const hasTsData = !!radar.data?.ts_status;
                    
                    const isAvstalld = hasTsData && (radar.data.ts_status?.toLowerCase().includes('avställd') || radar.data.ts_forbid?.toLowerCase().includes('ja'));

                    return (
                        <div key={radar.regnr} className="pointer-events-auto w-[calc(100vw-1.5rem)] sm:w-auto animate-in slide-in-from-bottom-8 sm:slide-in-from-right-8 fade-in zoom-in-95 duration-300 relative flex flex-col max-h-[85vh]">
                            
                            {/* MJUKARE SKUGGA OCH LJUSARE BAS (slate-800) */}
                            <div className="bg-slate-800/95 backdrop-blur-3xl ring-1 ring-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-2xl w-full sm:w-[420px] relative overflow-hidden flex flex-col font-sans h-full">
                                
                                <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors duration-500 ${radar.status === 'loading' ? 'bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0 animate-pulse' : radar.status === 'success' ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0' : 'bg-red-500'} z-10`}></div>
                                
                                <div className="absolute top-4 right-4 flex items-center gap-1 z-20">
                                    <button onClick={() => setMinimized(radar.regnr, true)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                        <window.Icon name="minus" size={14} />
                                    </button>
                                    <button onClick={() => closeRadar(radar.regnr)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
                                        <window.Icon name="x" size={14} />
                                    </button>
                                </div>

                                <div className="p-5 pb-4 border-b border-white/5 shrink-0 bg-slate-800/50 z-10">
                                    <div className="flex items-start gap-4">
                                        <div className="shrink-0 relative">
                                            {radar.status === 'loading' ? (
                                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                    <window.Icon name="loader" size={20} className="text-orange-400 animate-spin" />
                                                </div>
                                            ) : radar.status === 'success' ? (
                                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent"></div>
                                                    <window.Icon name="check" size={20} className="text-emerald-400 relative z-10" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                                    <window.Icon name="x" size={20} className="text-red-400" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col min-w-0 pt-0.5">
                                            <span className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${radar.status === 'loading' ? 'text-orange-400' : radar.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {radar.status === 'loading' ? 'INTRÄDER SYSTEM...' : radar.status === 'success' ? 'DATA FÅNGAD' : 'SÖKNING MISSLYCKADES'}
                                            </span>
                                            <h3 className="text-2xl font-black text-white tracking-widest font-mono leading-none drop-shadow-sm">{radar.regnr}</h3>
                                            {radar.data?.model && (radar.status === 'success' || radar.status === 'loading') && (
                                                <p className="text-[11px] text-slate-300 font-medium uppercase truncate mt-2 tracking-wider">{radar.data.model}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 overflow-y-auto custom-scrollbar flex-1 pb-6">
                                    {(radar.status === 'success' || radar.status === 'loading') && hasData && (
                                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {radar.data.oil && <StatCard icon="droplet" label="Oljevolym" val={radar.data.oil} />}
                                                {radar.data.engine && <StatCard icon="cpu" label="Motorkod" val={radar.data.engine} />}
                                                {radar.data.year && <StatCard icon="calendar" label="Årsmodell" val={radar.data.year} />}
                                                {radar.data.mileage && <StatCard icon="gauge" label="Miltal" val={radar.data.mileage} />}
                                                
                                                {hasTsData && (
                                                    <>
                                                        <StatCard icon="activity" label="Status" val={radar.data.ts_status} highlight={isAvstalld} />
                                                        <StatCard icon="check-circle" label="Besiktigad till" val={radar.data.ts_inspection} />
                                                        <StatCard icon="settings" label="Växellåda" val={radar.data.ts_gearbox} />
                                                        <StatCard icon="zap" label="Drivmedel" val={radar.data.ts_fuel} />
                                                    </>
                                                )}
                                            </div>

                                            {/* TERMINAL-INSPIRERAD VIN COPIER (Mjukare mörk färg) */}
                                            <div 
                                                onClick={() => handleCopyVin(radar.regnr, radar.data.vin)}
                                                title="Kopiera Chassinummer"
                                                className={`group cursor-pointer rounded-xl p-4 flex items-center justify-between transition-all duration-500 relative overflow-hidden ${isCopied ? 'bg-emerald-500/20 ring-1 ring-emerald-500/60' : 'bg-slate-900/40 ring-1 ring-white/10 hover:ring-white/20 hover:bg-slate-900/60'}`}
                                            >
                                                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none"></div>

                                                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent translate-x-[-100%] transition-transform duration-700 ${isCopied ? 'translate-x-[100%]' : ''}`}></div>
                                                
                                                <div className="flex flex-col min-w-0 relative z-10">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                                                        <window.Icon name="fingerprint" size={10} /> CHASSINUMMER (VIN)
                                                    </span>
                                                    <span className={`font-mono text-[14px] font-medium tracking-[0.25em] truncate transition-colors ${isCopied ? 'text-emerald-400' : radar.data.vin ? 'text-slate-200 group-hover:text-white' : 'text-slate-500'}`}>
                                                        {isCopied ? 'KOPIERAD!' : (radar.data.vin || 'SAKNAS')}
                                                    </span>
                                                </div>
                                                <div className={`shrink-0 relative z-10 transition-all duration-300 ${isCopied ? 'text-emerald-400 scale-110' : radar.data.vin ? 'text-slate-400 group-hover:text-white' : 'opacity-0'}`}>
                                                    <window.Icon name={isCopied ? "check" : "copy"} size={16} />
                                                </div>
                                            </div>

                                            {/* TINTED ACTION HUB (Mjukare bakgrunder) */}
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                
                                                <button 
                                                    onClick={() => window.osSearchVehicle(radar.regnr, 'START_TS_RADAR', true)}
                                                    className="h-10 flex items-center justify-center gap-2 bg-slate-700/40 hover:bg-purple-500/15 text-slate-300 hover:text-purple-300 border border-white/5 hover:border-purple-500/30 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all group"
                                                >
                                                    <window.Icon name={hasTsData ? "refresh-cw" : "shield"} size={12} className="text-purple-400 group-hover:rotate-180 transition-transform duration-500" /> TS
                                                </button>
                                                
                                                <button 
                                                    onClick={() => window.osSearchVehicle(radar.regnr, 'START_OS_RADAR', true)}
                                                    className="h-10 flex items-center justify-center gap-2 bg-slate-700/40 hover:bg-orange-500/15 text-slate-300 hover:text-orange-300 border border-white/5 hover:border-orange-500/30 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all group"
                                                >
                                                    <window.Icon name={radar.data.oil ? "refresh-cw" : "droplet"} size={12} className="text-orange-400 group-hover:rotate-180 transition-transform duration-500" /> Olja
                                                </button>

                                                <button 
                                                    onClick={(e) => handleQuickLink(e, radar.regnr, 'https://www.oljemagasinet.se/')}
                                                    className="h-10 flex items-center justify-center gap-1.5 bg-slate-700/40 hover:bg-blue-500/15 text-slate-300 hover:text-blue-300 border border-white/5 hover:border-blue-500/30 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all group"
                                                    title="Kopiera Regnr & Öppna Oljemagasinet"
                                                >
                                                    <window.Icon name="external-link" size={12} className="text-blue-400 group-hover:scale-110 transition-transform" /> Oljemag.
                                                </button>

                                                <button 
                                                    onClick={(e) => handleQuickLink(e, radar.data?.vin || radar.regnr, 'https://superetka.com/etka')}
                                                    className="h-10 flex items-center justify-center gap-2 bg-slate-700/40 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 hover:border-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all group"
                                                    title="Kopiera VIN & Öppna ETKA"
                                                >
                                                    <img src="https://www.etka.com/etkaportal/static/icons/logo.5feba87b.svg" alt="ETKA" className="h-3 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                                    ETKA
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {radar.status === 'not_found' && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col gap-3 mt-4">
                                            <div className="flex items-start gap-3">
                                                <window.Icon name="alert-circle" size={18} className="text-red-400 shrink-0 mt-0.5" />
                                                <span className="text-[12px] font-medium text-red-200 leading-relaxed">Systemet kunde inte hitta informationen.</span>
                                            </div>
                                            <button onClick={() => handleRetry(radar)} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-500/30 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2">
                                                <window.Icon name="refresh-cw" size={14} /> Försök Igen
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-800 to-transparent pointer-events-none rounded-b-2xl"></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
