const OptimizationModal = ({ setShowOptimizationModal }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6 animate-in fade-in duration-300">
            <div 
                className="absolute inset-0 bg-brand-950/80 backdrop-blur-sm cursor-pointer"
                onClick={() => setShowOptimizationModal(false)}
                aria-label="Stäng fönster"
            ></div>
            
            <div className="relative bg-brand-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <button 
                    onClick={() => setShowOptimizationModal(false)}
                    className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/40 backdrop-blur-md hover:bg-brand-500 text-white rounded-full flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white shadow-lg"
                >
                    <window.Icon name="x" size={18} />
                </button>

                <div className="overflow-y-auto no-scrollbar flex-1 w-full">
                    <div className="bg-gradient-to-br from-brand-950 to-brand-900 border-b border-white/5 p-6 sm:p-8 pr-14 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 blur-3xl rounded-full"></div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-3 relative z-10">
                            Dynex Performance
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight relative z-10 mb-2">
                            Frigör bilens <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-orange-300">dolda kraft</span>
                        </h3>
                        <p className="text-slate-300 text-sm md:text-base relative z-10 max-w-lg leading-relaxed">
                            Biltillverkarna stryper ofta motorerna från fabrik. Vi låser upp potentialen helt utan mekaniska ingrepp.
                        </p>
                    </div>

                    <div className="p-6 sm:p-8 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                <window.Icon name="zap" className="text-brand-500 mx-auto mb-2" size={24} />
                                <div className="font-bold text-white mb-1">Mer Hästkrafter</div>
                                <div className="text-xs text-slate-400">Snabbare & roligare</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                <window.Icon name="gauge" className="text-brand-500 mx-auto mb-2" size={24} />
                                <div className="font-bold text-white mb-1">Ökat Vridmoment</div>
                                <div className="text-xs text-slate-400">Säkrare omkörningar</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                <window.Icon name="fuel" className="text-brand-500 mx-auto mb-2" size={24} />
                                <div className="font-bold text-white mb-1">Lägre Förbrukning</div>
                                <div className="text-xs text-slate-400">Upp till 10% besparing</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                <window.Icon name="trending-up" className="text-brand-500" size={18} />
                                Typiska resultat (Före ➔ Efter)
                            </h4>
                            <div className="bg-brand-950 rounded-xl border border-white/5 overflow-hidden">
                                <div className="flex justify-between items-center p-3 border-b border-white/5 text-sm">
                                    <span className="text-slate-300 font-semibold">BMW 520d</span>
                                    <span className="text-brand-500 font-bold">190 hk ➔ 235 hk</span>
                                </div>
                                <div className="flex justify-between items-center p-3 border-b border-white/5 text-sm bg-white/[0.02]">
                                    <span className="text-slate-300 font-semibold">Audi A6 40 TDI</span>
                                    <span className="text-brand-500 font-bold">204 hk ➔ 245 hk</span>
                                </div>
                                <div className="flex justify-between items-center p-3 text-sm">
                                    <span className="text-slate-300 font-semibold">VW Golf 1.4 TSI</span>
                                    <span className="text-brand-500 font-bold">150 hk ➔ 180 hk</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-5 flex gap-4">
                            <window.Icon name="shield-check" className="text-brand-500 shrink-0" size={24} />
                            <div>
                                <h4 className="text-white font-bold mb-1 text-sm">100% Säkert & Beprövat</h4>
                                <p className="text-xs text-brand-100/80 leading-relaxed">
                                    Mjukvaran från Dynex Performance skräddarsys för din motor. Bilens inbyggda säkerhetsmarginaler behålls alltid intakta.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 bg-brand-950 border-t border-white/5">
                        <h4 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
                            <window.Icon name="calculator" className="text-brand-500" size={18} />
                            Kolla vad vi kan göra med din bil:
                        </h4>
                        <form 
                            className="flex flex-col sm:flex-row gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const btn = e.target.querySelector('button');
                                btn.innerHTML = 'Förfrågan skickad!';
                                btn.classList.add('bg-green-600', 'hover:bg-green-700');
                                setTimeout(() => setShowOptimizationModal(false), 2000);
                            }}
                        >
                            <input 
                                type="text" 
                                required 
                                placeholder="Regnr (T.ex. ABC 123)" 
                                className="flex-1 bg-brand-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm uppercase placeholder:normal-case font-bold" 
                            />
                            <input 
                                type="tel" 
                                required 
                                placeholder="Telefonnummer" 
                                className="flex-1 bg-brand-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm" 
                            />
                            <button type="submit" className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-white">
                                Få prisförslag <window.Icon name="arrow-right" size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Gör komponenten tillgänglig för app.js
window.OptimizationModal = OptimizationModal;
