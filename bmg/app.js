const { useState, useEffect, useCallback } = React;

window.Icon = ({ name, size = 24, className = "" }) => {
    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [name, size, className]); 
    return <i data-lucide={name} className={className} style={{ width: size, height: size }}></i>;
};

// --- STATISK DATA ---
const faqs = [
    { q: "Tar ni min nuvarande bil i inbyte?", a: "Självklart! Vi värderar din nuvarande bil och drar av beloppet på ditt nya bilköp. Kontakta oss för en kostnadsfri värdering." },
    { q: "Hur fungerar motoroptimering?", a: "Vi uppdaterar mjukvaran i bilens motorstyrenhet för att frigöra mer effekt och ofta sänka bränsleförbrukningen. Helt säkert och beprövat." },
    { q: "Kan jag reservera en bil?", a: "Ja, mot en handpenning kan vi reservera en bil åt dig under en överenskommen tid." }
];

const services = [
    { title: 'Köp', icon: 'shopping-cart', desc: 'Hitta din nästa drömbil hos oss. Vi garanterar fordon i toppskick.' },
    { title: 'Försäljning', icon: 'tag', desc: 'Vi säljer noggrant utvalda och testade fordon med full transparens.' },
    { title: 'Förmedling', icon: 'handshake', desc: 'Låt oss sälja din bil åt dig. Vi hanterar hela affären tryggt och smidigt.' },
    { title: 'Inbyten', icon: 'refresh-cw', desc: 'Vi tar självklart emot inbyten! Uppgradera din bil enkelt hos oss.' },
    { title: 'Motoroptimering', icon: 'zap', desc: 'Maximera prestandan och sänk bränsleförbrukningen med mjukvaruoptimering.' }
];

const reviews = [
    { name: 'Johan A.', text: 'En otroligt smidig bilaffär! Bilen var precis i det skick som beskrevs och personalen var mycket tillmötesgående. Rekommenderas starkt!' },
    { name: 'Amar S.', text: 'Lämnade in min bil för förmedling och BMG Motorgrupp skötte allt galant. Fick ett bättre pris än förväntat och slapp allt krångel.' },
    { name: 'Mirnel H.', text: 'Gjorde en motoroptimering på min skåpbil och märker en enorm skillnad både i styrka och bränsleförbrukning. Proffsigt rakt igenom.' }
];

// --- SKELETT-LADDARE FÖR BILAR ---
const CarSkeleton = () => (
    <div className="bg-brand-900/50 rounded-2xl overflow-hidden border border-white/5 shadow-xl animate-pulse">
        <div className="h-56 bg-white/5"></div>
        <div className="p-6">
            <div className="h-4 bg-white/10 rounded w-1/4 mb-3"></div>
            <div className="h-6 bg-white/10 rounded w-3/4 mb-6"></div>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="h-4 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded"></div>
            </div>
            <div className="h-8 bg-white/10 rounded w-1/3 mt-4"></div>
        </div>
    </div>
);

const App = () => {
    const [scrolled, setScrolled] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [cookieAccepted, setCookieAccepted] = useState(true);
    const [openFaq, setOpenFaq] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const [cars, setCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(true);
    const [apiError, setApiError] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('bmg_cookie_consent');
        if (!consent) setCookieAccepted(false);

        let timeoutId;
        const handleScroll = () => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                setScrolled(window.scrollY > 50);
                setShowScrollTop(window.scrollY > 500);
                timeoutId = null;
            }, 100); 
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://elfsightcdn.com/platform.js";
        script.async = true;
        document.body.appendChild(script);
        
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        const fetchBlocketCars = async () => {
            try {
                const apiEndpoint = "https://onetimesecret.schibsted.se/2u18i0z601ty8qwn5q69w6jflg66sgm";
                const response = await fetch(apiEndpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': '2u18i0z601ty8qwn5q69w6jflg66sgm' 
                    }
                });
                
                if(!response.ok) throw new Error("Kunde inte ansluta till API");
                const data = await response.json();
                
                const formattedCars = data.data.map(car => ({
                    id: car.id || Math.random(),
                    brand: car.make || "Okänt",
                    model: car.model || "Modell",
                    year: car.regdate?.year || car.model_year || "-",
                    mil: `${car.mileage || 0} mil`,
                    gear: car.gearbox || "Manuell/Automat",
                    price: `${car.price?.value || car.price || 0} kr`,
                    fuel: car.fuel || "-",
                    img: car.images && car.images.length > 0 ? car.images[0].url : 'https://images.unsplash.com/photo-1555353540-64fd8b01a757?w=800&q=80'
                }));
                
                setCars(formattedCars);
                setApiError(false);
            } catch (error) {
                console.error("Kunde inte hämta bilar:", error);
                setApiError(true);
                setCars([]); 
            } finally {
                setLoadingCars(false);
            }
        };

        fetchBlocketCars();
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('bmg_cookie_consent', 'true');
        setCookieAccepted(true);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden">
            
            {/* --- NAVBAR --- */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? 'bg-brand-950/95 backdrop-blur-md shadow-lg py-3 md:py-4 border-b border-white/5' : 'bg-transparent py-4 md:py-6'}`} aria-label="Huvudmeny">
                <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg outline-none" onClick={scrollToTop} tabIndex="0" role="button" aria-label="Gå till toppen">
                        <img 
                            src="bmglogo.png" 
                            alt="BMG Motorgrupp Logotyp" 
                            className="h-10 w-10 md:h-14 md:w-14 object-contain drop-shadow-[0_0_12px_rgba(249,115,22,0.15)] transition-transform duration-300 group-hover:scale-105" 
                        />
                        {/* Tog bort "hidden" så texten syns på mobil, anpassade storleken för att passa */}
                        <div className="text-lg md:text-2xl font-black tracking-tighter text-white uppercase">
                            BMG <span className="text-brand-500 font-light">Motorgrupp</span>
                        </div>
                    </div>
                    
                    <div className="hidden md:flex gap-8 text-sm font-semibold tracking-wide items-center">
                        <a href="#tjanster" className="hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none p-1">Tjänster</a>
                        <a href="#om-oss" className="hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none p-1">Om oss</a>
                        <a href="#recensioner" className="hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none p-1">Omdömen</a>
                        <a href="#kontakt" className="hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none p-1">Kontakt</a>
                        <a href="#lager" className="bg-brand-500 text-white px-5 py-2 rounded-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 focus-visible:ring-2 focus-visible:ring-white outline-none">Bilar i lager</a>
                    </div>

                    <button 
                        className="md:hidden text-white p-2 hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none" 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-expanded={mobileMenuOpen}
                        aria-label={mobileMenuOpen ? "Stäng meny" : "Öppna meny"}
                    >
                        <window.Icon name={mobileMenuOpen ? "x" : "menu"} size={28} />
                    </button>
                </div>

                <div className={`md:hidden absolute top-full left-0 w-full bg-brand-950/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-[400px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col px-6 py-4 gap-6 font-semibold text-lg">
                        <a href="#tjanster" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-brand-500 flex items-center gap-3"><window.Icon name="settings" size={20}/> Tjänster</a>
                        <a href="#om-oss" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-brand-500 flex items-center gap-3"><window.Icon name="info" size={20}/> Om oss</a>
                        <a href="#recensioner" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-brand-500 flex items-center gap-3"><window.Icon name="star" size={20}/> Omdömen</a>
                        <a href="#kontakt" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-brand-500 flex items-center gap-3"><window.Icon name="phone" size={20}/> Kontakt</a>
                        <a href="#lager" onClick={() => setMobileMenuOpen(false)} className="text-brand-500 flex items-center gap-3"><window.Icon name="car" size={20}/> Bilar i lager</a>
                    </div>
                </div>
            </nav>

            <main>
                {/* --- HERO --- */}
                <header className="hero-bg min-h-screen flex items-center pt-20">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 w-full mt-10 md:mt-0">
                        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-[10px] md:text-sm font-bold tracking-widest uppercase mb-4 md:mb-6">
                                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                                Kvalitet & Transparens
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.1] mb-4 md:mb-6 tracking-tight">
                                Din partner för <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-orange-300">
                                    Rätt Fordon
                                </span>
                            </h1>
                            <p className="text-base md:text-lg text-slate-300 mb-8 md:mb-10 leading-relaxed max-w-xl pr-4 md:pr-0">
                                Specialister på begagnade personbilar, lätta motorfordon och fordonsoptimering. Hög kvalitet till konkurrenskraftiga priser i Eslöv.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="#lager" 
                                   className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg shadow-brand-500/25 focus-visible:ring-2 focus-visible:ring-white outline-none">
                                    <window.Icon name="car" size={20} />
                                    Se bilar i lager
                                </a>
                                <a href="#kontakt" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-brand-500 outline-none">
                                    Kontakta oss
                                </a>
                            </div>
                        </div>
                    </div>
                </header>

                {/* --- TRYGGHET BANNER --- */}
                <div className="bg-brand-900 border-y border-white/5 py-6 md:py-8">
                    {/* Justerat layouten så ikonerna hamnar i en perfekt vertikal linje på mobil, men gruppen är centrerad */}
                    <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-center">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10 md:gap-16 opacity-80">
                            <div className="flex items-center gap-3 text-slate-300 font-semibold text-sm md:text-base">
                                <window.Icon name="shield-check" className="text-brand-500 shrink-0" size={24} />
                                <span>Trygga garantier</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300 font-semibold text-sm md:text-base">
                                <window.Icon name="credit-card" className="text-brand-500 shrink-0" size={24} />
                                <span>Smidig finansiering</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300 font-semibold text-sm md:text-base">
                                <window.Icon name="check-circle" className="text-brand-500 shrink-0" size={24} />
                                <span>Noggrant testade fordon</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- LAGER --- */}
                <section id="lager" className="py-16 md:py-24 bg-brand-950 border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="mb-8 md:mb-12">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 md:mb-4">Vårt utbud just nu</h2>
                            <p className="text-slate-400 text-base md:text-lg">Här ser du alla fordon vi har i lager, redo för leverans.</p>
                        </div>

                        {loadingCars ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {[1, 2, 3].map(i => <CarSkeleton key={i} />)}
                            </div>
                        ) : apiError ? (
                            /* Snyggt meddelande istället för vit iframe vid fel/ingen API-nyckel */
                            <div className="text-center py-16 md:py-24 bg-brand-900/50 rounded-2xl border border-white/5 shadow-inner flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-lg">
                                    <window.Icon name="car" className="text-brand-500" size={32} />
                                </div>
                                <h3 className="text-xl md:text-3xl font-bold text-white mb-4">Vårt digitala showroom</h3>
                                <p className="text-slate-400 mb-8 max-w-lg px-4 leading-relaxed text-sm md:text-base">
                                    Vårt lager uppdateras hela tiden. Tryck på knappen nedan för att se samtliga bilar som är tillgängliga för försäljning just nu.
                                </p>
                                <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" 
                                   className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-lg font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-lg shadow-brand-500/25 focus-visible:ring-2 focus-visible:ring-white outline-none">
                                    Se alla bilar på Blocket <window.Icon name="external-link" size={18} />
                                </a>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {cars.map(car => (
                                    <article key={car.id} className="bg-brand-900 rounded-2xl overflow-hidden border border-white/5 hover:border-brand-500/50 transition-all group shadow-xl flex flex-col">
                                        <div className="h-48 md:h-56 overflow-hidden relative bg-brand-950 flex items-center justify-center shrink-0">
                                            <img src={car.img} alt={`Begagnad ${car.brand} ${car.model} till salu`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {e.target.src = "https://images.unsplash.com/photo-1555353540-64fd8b01a757?w=800&q=80"}} />
                                        </div>
                                        <div className="p-5 md:p-6 flex flex-col flex-grow">
                                            <div className="text-brand-500 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">{car.brand}</div>
                                            <h3 className="text-lg md:text-xl font-bold text-white mb-4 line-clamp-1" title={car.model}>{car.model}</h3>
                                            
                                            <div className="grid grid-cols-2 gap-y-2 md:gap-y-3 gap-x-4 mb-6 text-xs md:text-sm text-slate-400 flex-grow">
                                                <div className="flex items-center gap-2"><window.Icon name="calendar" size={16} /> {car.year}</div>
                                                <div className="flex items-center gap-2"><window.Icon name="gauge" size={16} /> {car.mil}</div>
                                                <div className="flex items-center gap-2"><window.Icon name="settings-2" size={16} /> {car.gear}</div>
                                                <div className="flex items-center gap-2"><window.Icon name="fuel" size={16} /> {car.fuel}</div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-auto">
                                                <div className="text-xl md:text-2xl font-black text-white">{car.price}</div>
                                                <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" aria-label={`Se mer om ${car.brand} ${car.model}`} className="bg-white/10 hover:bg-brand-500 text-white p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 outline-none">
                                                    <window.Icon name="arrow-right" size={20} />
                                                </a>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                        
                        {(cars.length > 0 && !apiError && !loadingCars) && (
                            <div className="mt-10 md:mt-12 flex justify-center">
                                <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" 
                                   className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-6 py-4 md:py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 outline-none">
                                    Se hela butiken på Blocket <window.Icon name="external-link" size={18} />
                                </a>
                            </div>
                        )}
                    </div>
                </section>

                {/* --- OM OSS --- */}
                <section id="om-oss" className="py-16 md:py-24 bg-brand-900">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 text-white tracking-tight">Vår Affärsidé</h2>
                            <div className="w-16 md:w-20 h-1 bg-brand-500 mb-6 md:mb-8 rounded-full"></div>
                            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6">
                                Vi är en bilhandlare som är specialiserade på försäljning av begagnade personbilar och lätta motorfordon. Vår affärsidé bygger på att erbjuda fordon av hög kvalitet till konkurrenskraftiga priser.
                            </p>
                            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
                                Vi prioriterar transparens och strävar efter att alltid leverera en förstklassig kundupplevelse från första kontakt till nycklarna i handen.
                            </p>
                            <div className="text-lg md:text-xl font-bold text-white flex items-start md:items-center gap-3">
                                <window.Icon name="map-pin" className="text-brand-500 shrink-0 mt-1 md:mt-0" />
                                Varmt välkomna in till oss i Eslöv!
                            </div>
                        </div>
                        
                        <div className="bg-brand-950 p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-3xl rounded-full group-hover:bg-brand-500/20 transition-all"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                                    <window.Icon name="external-link" className="text-brand-500" size={28} />
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Vårt digitala showroom</h3>
                                <p className="text-sm md:text-base text-slate-400 mb-6 md:mb-8">
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

                {/* --- TJÄNSTER --- */}
                <section id="tjanster" className="py-16 md:py-24 bg-brand-950 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="text-center mb-10 md:mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 md:mb-4">Våra Tjänster</h2>
                            <p className="text-slate-400 text-base md:text-lg">Heltäckande lösningar för din nästa bilaffär.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
                            {services.map((service, idx) => (
                                <article key={idx} className="bg-brand-900 border border-white/5 p-5 md:p-6 rounded-2xl hover:border-brand-500/50 transition-colors group">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-950 rounded-lg flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                                        <window.Icon name={service.icon} className="text-brand-500" size={20} />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{service.title}</h3>
                                    <p className="text-slate-300 leading-relaxed text-sm">{service.desc}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- KUNDRECENSIONER --- */}
                <section id="recensioner" className="py-16 md:py-24 bg-brand-900 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="text-center mb-10 md:mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 md:mb-4">Vad våra kunder säger</h2>
                            <p className="text-slate-400 text-base md:text-lg">Kundnöjdhet är vår högsta prioritet.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {reviews.map((review, idx) => (
                                <blockquote key={idx} className="bg-brand-950 p-6 md:p-8 rounded-2xl border border-white/5 relative">
                                    <window.Icon name="quote" className="text-brand-500/20 absolute top-4 right-4 md:top-6 md:right-6" size={40} />
                                    <div className="flex text-brand-500 mb-4" aria-label="5 av 5 stjärnor">
                                        {[...Array(5)].map((_, i) => <window.Icon key={i} name="star" className="fill-brand-500" size={16} />)}
                                    </div>
                                    <p className="text-sm md:text-base text-slate-300 italic mb-6">"{review.text}"</p>
                                    <footer className="font-bold text-white text-sm md:text-base">- {review.name}</footer>
                                </blockquote>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- FAQ OCH KONTAKT --- */}
                <section id="kontakt" className="py-16 md:py-24 bg-brand-950 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 md:gap-16">
                        
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 md:mb-6">Kontakta & Hitta oss</h2>
                            <p className="text-slate-400 mb-8 text-base md:text-lg">
                                Boka gärna tid innan ditt besök för att säkerställa att det fordon du är intresserad utav finns kvar i lager.
                            </p>
                            
                            <address className="space-y-6 mb-10 md:mb-12 not-italic">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                                        <window.Icon name="phone" className="text-brand-500" size={18} />
                                    </div>
                                    <div>
                                        <div className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Telefon / SMS</div>
                                        <a href="tel:0733447449" className="text-lg md:text-xl text-white font-bold hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none inline-block">073-34 47 449</a>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                                        <window.Icon name="mail" className="text-brand-500" size={18} />
                                    </div>
                                    <div>
                                        <div className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">E-postadress</div>
                                        <a href="mailto:info@bmotorgrupp.se" className="text-lg md:text-xl text-white font-bold hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none inline-block">info@bmotorgrupp.se</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                                        <window.Icon name="map-pin" className="text-brand-500" size={18} />
                                    </div>
                                    <div>
                                        <div className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Besöksadress</div>
                                        <a href="https://maps.google.com/?q=Grävmaskinsvägen+5,24138+Eslöv" target="_blank" rel="noopener noreferrer" className="text-base md:text-lg text-white font-semibold hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none inline-block">
                                            Grävmaskinsvägen 5<br/>241 38 Eslöv
                                        </a>
                                    </div>
                                </div>
                            </address>

                            <div className="w-full h-56 md:h-64 bg-slate-800 rounded-xl overflow-hidden mb-10 md:mb-12 border border-white/10">
                                <iframe 
                                    title="Karta över BMG Motorgrupp"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2240.767635749234!2d13.325103476624808!3d55.83199237311359!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x465394ce6c2b9e21%3A0x65cbd9f60f6e7072!2zR3LDpHZtYXNraW5zdsOkZ2VuIDUsIDI0MSAzOCBFc2zDtnY!5e0!3m2!1ssv!2sse!4v1772320405490!5m2!1ssv!2sse" 
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 0 }} 
                                    allowFullScreen="" 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade">
                                </iframe>
                            </div>

                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Vanliga frågor</h3>
                                <div className="space-y-3 md:space-y-4">
                                    {faqs.map((faq, idx) => (
                                        <div key={idx} className="border border-white/10 rounded-lg bg-brand-900 overflow-hidden">
                                            <button 
                                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                                aria-expanded={openFaq === idx}
                                                className="w-full text-left px-5 py-4 font-semibold text-white flex justify-between items-center focus-visible:bg-white/5 outline-none transition-colors text-sm md:text-base"
                                            >
                                                {faq.q}
                                                <window.Icon name={openFaq === idx ? "chevron-up" : "chevron-down"} className="text-brand-500 shrink-0 ml-4" size={20} />
                                            </button>
                                            <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <div className="px-5 pb-4 text-slate-400 leading-relaxed border-t border-white/5 pt-3 md:pt-4 text-sm md:text-base">
                                                    {faq.a}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 md:space-y-8">
                            <div className="bg-brand-900 p-6 md:p-8 rounded-2xl border border-white/5 shadow-xl">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-6">Skicka ett meddelande</h3>
                                <form className="space-y-4" onSubmit={(e) => { 
                                    e.preventDefault(); 
                                    const btn = e.target.querySelector('button');
                                    const oldText = btn.innerHTML;
                                    btn.innerHTML = 'Skickat! Vi hör av oss.';
                                    btn.classList.add('bg-green-600', 'hover:bg-green-700');
                                    setTimeout(() => {
                                        e.target.reset();
                                        btn.innerHTML = oldText;
                                        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                                    }, 4000);
                                }}>
                                    <div>
                                        <label htmlFor="name" className="block text-xs md:text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Namn</label>
                                        <input type="text" id="name" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm md:text-base" placeholder="Ditt namn" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="phone" className="block text-xs md:text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Telefon</label>
                                            <input type="tel" id="phone" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm md:text-base" placeholder="Ditt telefonnummer" />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-xs md:text-sm font-semibold text-slate-400 mb-2 cursor-pointer">E-post</label>
                                            <input type="email" id="email" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm md:text-base" placeholder="Din e-post" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-xs md:text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Meddelande / Regnr</label>
                                        <textarea id="message" rows="4" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-y text-sm md:text-base" placeholder="Vad kan vi hjälpa dig med? Ange gärna registreringsnummer vid inbyte."></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-lg transition-all hover:scale-[1.02] flex justify-center items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-white">
                                        <window.Icon name="send" size={18} /> Skicka förfrågan
                                    </button>
                                </form>
                            </div>

                            <div className="bg-brand-900 p-6 md:p-8 rounded-2xl border border-white/5 shadow-xl">
                                <div className="flex items-center gap-3 mb-5 md:mb-6 border-b border-white/10 pb-5 md:pb-6">
                                    <window.Icon name="clock" className="text-brand-500" size={24} />
                                    <h3 className="text-xl md:text-2xl font-bold text-white">Öppettider</h3>
                                </div>
                                
                                <ul className="space-y-4 md:space-y-5 text-base md:text-lg">
                                    <li className="flex justify-between items-center text-slate-300">
                                        <span>Måndag – Fredag</span>
                                        <span className="font-bold text-white text-lg md:text-xl">11:00 – 18:00</span>
                                    </li>
                                    
                                    <li className="flex justify-between items-start sm:items-center text-slate-300 border-t border-white/5 pt-4 md:pt-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-0.5 sm:mt-0">
                                            <span>Lördag – Söndag</span>
                                            <span className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2 md:px-2.5 py-1 rounded-md border border-brand-500/20 w-fit">
                                                <window.Icon name="clock" size={12} className="md:w-3.5 md:h-3.5" />
                                                Endast tidsbokning
                                            </span>
                                        </div>
                                        <span className="font-bold text-white text-lg md:text-xl shrink-0 mt-0">11:00 – 15:00</span>
                                    </li>
                                </ul>
                                
                                <div className="mt-6 md:mt-8 bg-brand-500/10 border border-brand-500/20 p-4 rounded-lg flex items-start gap-3">
                                    <window.Icon name="info" className="text-brand-500 shrink-0 mt-0.5" size={18} />
                                    <p className="text-xs md:text-sm text-brand-100/80 leading-relaxed">
                                        För tidsbokning under helger, vänligen kontakta oss via telefon eller mail i god tid.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- ELFSIGHT INSTAGRAM-FLÖDET --- */}
                <section className="py-16 md:py-24 bg-brand-950 border-t border-white/5 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-6 text-center md:text-left">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                                    <window.Icon name="instagram" className="text-brand-500" size={28} />
                                    Följ vår vardag
                                </h2>
                                <p className="text-sm md:text-base text-slate-400 max-w-lg">Följ @bmg.motorgrupp på Instagram för de senaste bilarna och en titt bakom kulisserna.</p>
                            </div>
                            <a href="https://instagram.com/bmg.motorgrupp" target="_blank" rel="noopener noreferrer" className="w-full md:w-auto bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 md:py-3 rounded-lg font-bold flex justify-center items-center transition-all hover:scale-105 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white outline-none">
                                Följ oss
                            </a>
                        </div>
                        
                        <div className="elfsight-app-bd475f3d-0848-4f19-a61c-394708e42db4" data-elfsight-app-lazy="true"></div>
                        
                    </div>
                </section>
            </main>

            {/* --- FOOTER --- */}
            <footer className="bg-brand-900 py-10 md:py-12 border-t border-white/10 text-center md:text-left text-slate-500 text-xs md:text-sm">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                        <img src="bmglogo.png" alt="BMG Motorgrupp Logotyp" className="h-10 w-10 md:h-12 md:w-12 object-contain" loading="lazy" />
                        <div className="flex flex-col items-center md:items-start">
                            <div className="text-lg md:text-xl font-black text-white uppercase tracking-tighter mb-1">BMG Motorgrupp</div>
                            <p className="mb-4">© {new Date().getFullYear()} Alla rättigheter förbehållna.</p>
                            
                            <a href="https://amarsut.github.io/lager/AS/" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none">
                                <img src="as.jpg" alt="Byggd av AS" className="h-7 md:h-8 object-contain rounded-sm" loading="lazy" />
                            </a>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <a href="#" aria-label="Besök vår Facebook-sida" className="w-10 h-10 bg-white/5 hover:bg-brand-500 rounded-full flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none">
                            <window.Icon name="facebook" size={20} />
                        </a>
                        <a href="https://instagram.com/bmg.motorgrupp" target="_blank" rel="noopener noreferrer" aria-label="Besök vår Instagram-sida" className="w-10 h-10 bg-white/5 hover:bg-brand-500 rounded-full flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none">
                            <window.Icon name="instagram" size={20} />
                        </a>
                    </div>
                </div>
            </footer>

            {/* Fasta knappar */}
            <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 flex flex-col gap-3 z-40">
                <button 
                    onClick={scrollToTop}
                    className={`w-12 h-12 md:w-12 md:h-12 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand-500 outline-none ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}
                    aria-label="Skrolla till toppen"
                >
                    <window.Icon name="arrow-up" size={24} />
                </button>
                
                {/* Dölj/Visa mobil-telefonen baserat på scroll */}
                <a 
                    href="tel:0733447449"
                    className={`md:hidden w-12 h-12 bg-brand-500 text-white rounded-full shadow-xl shadow-brand-500/30 flex items-center justify-center transition-all duration-300 active:scale-95 ${scrolled ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}
                    aria-label="Ring oss"
                >
                    <window.Icon name="phone" size={20} />
                </a>
            </div>

            {!cookieAccepted && (
                <div className="fixed bottom-0 left-0 w-full bg-brand-950/95 backdrop-blur-md border-t border-white/10 z-50 p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-full duration-500">
                    <div className="text-slate-300 text-sm md:text-base max-w-4xl">
                        <strong className="text-white block mb-1">Vi värnar om din integritet</strong>
                        Vi använder cookies för att förbättra din upplevelse på webbplatsen, analysera trafik och anpassa innehåll. Genom att surfa vidare godkänner du vår användning av cookies.
                    </div>
                    <div className="flex gap-4 w-full md:w-auto shrink-0">
                        <button onClick={acceptCookies} className="w-full md:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white outline-none">
                            Jag godkänner
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
