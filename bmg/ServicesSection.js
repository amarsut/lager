const ServicesSection = ({ setShowOptimizationModal }) => {
    return (
        <section id="tjanster" className="py-24 bg-brand-950 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Våra Tjänster</h2>
                    <p className="text-slate-400 text-lg">Heltäckande lösningar för din nästa bilaffär.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {/* services hämtas automatiskt från data.js */}
                    {services.map((service, idx) => {
                        const isClickable = service.action === 'optimization';
                        return (
                            <article 
                                key={idx} 
                                onClick={isClickable ? () => setShowOptimizationModal(true) : undefined}
                                className={`bg-brand-900 border p-6 rounded-2xl transition-all group relative overflow-hidden
                                    ${isClickable 
                                        ? 'border-brand-500/30 cursor-pointer hover:border-brand-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-brand-500/10 hover:ring-brand-500/50 hover:-translate-y-1' 
                                        : 'border-white/5 hover:border-brand-500/50'
                                    }`}
                            >
                                {isClickable && (
                                    <div className="absolute top-4 right-4 bg-brand-500/10 text-brand-500 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                        Läs mer <window.Icon name="arrow-right" size={12} />
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-transform group-hover:scale-110 
                                    ${isClickable ? 'bg-brand-500/20 text-brand-500' : 'bg-brand-950 text-brand-500'}`}>
                                    <window.Icon name={service.icon} size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                                <p className="text-slate-300 leading-relaxed text-sm">{service.desc}</p>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// Glöm inte att göra den global!
window.ServicesSection = ServicesSection;
