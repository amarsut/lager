const { useState, useEffect } = React;

// Ikon-komponent (Samma som i ditt OS)
window.Icon = ({ name, size = 24, className = "" }) => {
    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });
    return <i data-lucide={name} className={className} style={{ width: size, height: size }}></i>;
};

const App = () => {
    const [scrolled, setScrolled] = useState(false);

    // Hantera navbar-styling vid scroll
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen flex flex-col font-sans">
            
            {/* --- NAVBAR --- */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-brand-950/90 backdrop-blur-md shadow-lg py-4 border-b border-white/5' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="text-2xl font-black tracking-tighter text-white uppercase flex items-center gap-2">
                        <window.Icon name="gauge" className="text-brand-500" size={28} />
                        BMG <span className="text-brand-500 font-light">Motorgrupp</span>
                    </div>
                    <div className="hidden md:flex gap-8 text-sm font-semibold tracking-wide">
                        <a href="#tjanster" className="hover:text-brand-500 transition-colors">Tjänster</a>
                        <a href="#om-oss" className="hover:text-brand-500 transition-colors">Om oss</a>
                        <a href="#kontakt" className="hover:text-brand-500 transition-colors">Kontakt</a>
                        <a href="#lager" className="text-brand-500 hover:text-white transition-colors">Bilar i lager</a>
                    </div>
                </div>
            </nav>

            {/* --- HERO SEKTION --- */}
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
                            Specialister på begagnade personbilar, lätta motorfordon och fordonsoptimering. Hög kvalitet till konkurrenskraftiga priser.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" 
                               className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg shadow-brand-500/25">
                                <window.Icon name="car" size={20} />
                                Se bilar i lager
                            </a>
                            <a href="#kontakt" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all backdrop-blur-sm">
                                Boka visning
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- OM OSS / BESKRIVNING --- */}
            <section id="om-oss" className="py-24 bg-brand-900 border-b border-white/5">
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
                            <window.Icon name="thumbs-up" className="text-brand-500" />
                            Varmt välkomna in till oss!
                        </div>
                    </div>
                    
                    {/* BLOCKET PORTAL KORT */}
                    <div id="lager" className="bg-brand-950 p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
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
                               className="w-full bg-white text-brand-950 py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                                Gå till vår Blocket-butik <window.Icon name="arrow-right" size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TJÄNSTER --- */}
            <section id="tjanster" className="py-24 bg-brand-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Våra Tjänster</h2>
                        <p className="text-slate-400 text-lg">Heltäckande lösningar för din nästa bilaffär.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: 'Köp', icon: 'shopping-cart', desc: 'Hitta din nästa drömbil hos oss. Vi garanterar fordon i toppskick.' },
                            { title: 'Försäljning', icon: 'tag', desc: 'Vi säljer noggrant utvalda och testade fordon med full transparens.' },
                            { title: 'Förmedling', icon: 'handshake', desc: 'Låt oss sälja din bil åt dig. Vi hanterar hela affären tryggt och smidigt.' },
                            { title: 'Inbyten', icon: 'refresh-cw', desc: 'Vi tar självklart emot inbyten! Uppgradera din bil enkelt hos oss.' }
                        ].map((service, idx) => (
                            <div key={idx} className="bg-brand-900 border border-white/5 p-8 rounded-2xl hover:border-brand-500/50 transition-colors group">
                                <div className="w-12 h-12 bg-brand-950 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <window.Icon name={service.icon} className="text-brand-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{service.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- KONTAKT OCH ÖPPETTIDER --- */}
            <section id="kontakt" className="py-24 bg-brand-900 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16">
                    {/* Info */}
                    <div>
                        <h2 className="text-3xl font-black text-white mb-6">Kontakta oss</h2>
                        <p className="text-slate-400 mb-8 text-lg">
                            Boka gärna tid innan ditt besök för att säkerställa att det fordon du är intresserad utav finns kvar i lager.
                        </p>
                        
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                                    <window.Icon name="phone" className="text-brand-500" size={20} />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Telefon / SMS</div>
                                    <a href="tel:0733447449" className="text-xl text-white font-bold hover:text-brand-500 transition-colors">073-34 47 449</a>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                                    <window.Icon name="mail" className="text-brand-500" size={20} />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">E-postadress</div>
                                    <a href="mailto:info@bmotorgrupp.se" className="text-xl text-white font-bold hover:text-brand-500 transition-colors">info@bmotorgrupp.se</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Öppettider */}
                    <div className="bg-brand-950 p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-6">
                            <window.Icon name="clock" className="text-brand-500" size={24} />
                            <h3 className="text-2xl font-bold text-white">Öppettider</h3>
                        </div>
                        
                        <ul className="space-y-4 text-lg">
                            <li className="flex justify-between items-center text-slate-300">
                                <span>Måndag – Fredag</span>
                                <span className="font-bold text-white">11:00 – 18:00</span>
                            </li>
                            <li className="flex justify-between items-center text-slate-300">
                                <span>Lördag – Söndag</span>
                                <span className="font-bold text-brand-500 text-sm uppercase tracking-wider">Endast Tidsbokning</span>
                            </li>
                        </ul>
                        
                        <div className="mt-8 bg-brand-500/10 border border-brand-500/20 p-4 rounded-lg flex items-start gap-3">
                            <window.Icon name="info" className="text-brand-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-brand-100/80 leading-relaxed">
                                För tidsbokning under helger, vänligen kontakta oss via telefon eller mail i god tid.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-brand-950 py-8 border-t border-white/5 text-center text-slate-500 text-sm">
                <p>&copy; {new Date().getFullYear()} BMG Motorgrupp. Alla rättigheter förbehållna.</p>
            </footer>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
