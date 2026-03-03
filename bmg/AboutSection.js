const AboutSection = () => {
    return (
        <section id="om-oss" className="py-24 bg-brand-900">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">Vår Affärsidé</h2>
                    <div className="w-20 h-1 bg-brand-500 mb-8 rounded-full"></div>
                    <p className="text-slate-300 text-lg leading-relaxed mb-6">
                        Vi är en bilhandlare som är specialiserade på försäljning av begagnade personbilar och lätta motorfordon. Vår affärsidé bygger på att erbjuda fordon av hög kvalitet till konkurrenskraftiga priser.
                    </p>
                    <p className="text-slate-300 text-lg leading-relaxed mb-8">
                        Vi prioriterar transparens och strävar efter att alltid leverera en förstklassig kundupplevelse från första kontakt till nycklarna i handen.
                    </p>
                    <div className="text-xl font-bold text-white flex items-center gap-3">
                        <window.Icon name="map-pin" className="text-brand-500" /> Varmt välkomna in till oss i Eslöv!
                    </div>
                </div>
                
                <div className="bg-brand-950 p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-3xl rounded-full group-hover:bg-brand-500/20 transition-all"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                            <window.Icon name="external-link" className="text-brand-500" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Vårt digitala showroom</h3>
                        <p className="text-slate-400 mb-8">
                            För att alltid ge dig den mest aktuella informationen uppdateras vårt fordonslager i realtid på Blocket. Klicka nedan för att se vad vi har inne just nu.
                        </p>
                        <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" 
                           className="w-full bg-white text-brand-950 py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 outline-none">
                            Gå till vår Blocket-butik <window.Icon name="arrow-right" size={18} />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

window.AboutSection = AboutSection;
