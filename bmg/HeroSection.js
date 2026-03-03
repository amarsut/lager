const HeroSection = () => {
    return (
        <React.Fragment>
            <header className="hero-bg min-h-screen flex items-center pt-20">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-sm font-bold tracking-widest uppercase mb-6">
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                            Kvalitet & Transparens
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                            Din partner för <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-orange-300">
                                Rätt Fordon
                            </span>
                        </h1>
                        <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-xl">
                            Specialister på begagnade personbilar, lätta motorfordon och fordonsoptimering. Hög kvalitet till konkurrenskraftiga priser i Eslöv.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="#lager" className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg shadow-brand-500/25 focus-visible:ring-2 focus-visible:ring-white outline-none">
                                <window.Icon name="car" size={20} /> Se bilar i lager
                            </a>
                            <a href="#kontakt" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-brand-500 outline-none">
                                Kontakta oss
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <div className="bg-brand-950/80 backdrop-blur-md border-y border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-x-6 gap-y-4">
                    <div className="flex items-center gap-2.5 group cursor-default">
                        <window.Icon name="shield-check" className="text-brand-500 group-hover:scale-110 transition-transform duration-300" size={18} />
                        <span className="text-xs md:text-sm text-slate-300 font-semibold uppercase tracking-widest">Trygga garantier</span>
                    </div>
                    <div className="hidden md:block w-px h-4 bg-white/10"></div>
                    <div className="flex items-center gap-2.5 group cursor-default">
                        <window.Icon name="credit-card" className="text-brand-500 group-hover:scale-110 transition-transform duration-300" size={18} />
                        <span className="text-xs md:text-sm text-slate-300 font-semibold uppercase tracking-widest">Smidig finansiering</span>
                    </div>
                    <div className="hidden md:block w-px h-4 bg-white/10"></div>
                    <div className="flex items-center gap-2.5 group cursor-default">
                        <window.Icon name="check-circle" className="text-brand-500 group-hover:scale-110 transition-transform duration-300" size={18} />
                        <span className="text-xs md:text-sm text-slate-300 font-semibold uppercase tracking-widest">Testade fordon</span>
                    </div>
                    <div className="hidden md:block w-px h-4 bg-white/10"></div>
                    <div className="flex items-center gap-3 group cursor-default">
                        <img src="ucbrons.png" alt="UC Brons" className="h-6 md:h-7 w-auto object-contain brightness-110 drop-shadow-md" />
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] text-brand-500 font-black uppercase tracking-widest leading-none mb-0.5">Certifierad</span>
                            <span className="text-xs md:text-sm text-slate-300 font-semibold uppercase tracking-widest leading-none">Trygg partner</span>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

window.HeroSection = HeroSection;
