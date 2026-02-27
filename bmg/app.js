const { useState, useEffect } = React;

// Uppdaterad Ikon-komponent (optimerad)
window.Icon = ({ name, size = 24, className = "" }) => {
    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [name, size, className]); 
    return <i data-lucide={name} className={className} style={{ width: size, height: size }}></i>;
};

const App = () => {
    const [scrolled, setScrolled] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [cookieAccepted, setCookieAccepted] = useState(true);
    const [openFaq, setOpenFaq] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // State för finansieringskalkylatorn (Kontant vs Månad)
    const [showMonthly, setShowMonthly] = useState(false);
    
    const [latestCars, setLatestCars] = useState([]);

    // Hantera scroll-effekter och kex (cookies)
    useEffect(() => {
        const consent = localStorage.getItem('bmg_cookie_consent');
        if (!consent) setCookieAccepted(false);

        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
            setShowScrollTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        
        // Simulerad data för bilarna
        setTimeout(() => {
            setLatestCars([
                { id: 1, brand: 'Volvo', model: 'XC60 T8 AWD Recharge', year: 2021, mil: '4 500 mil', gear: 'Automat', price: '489 900 kr', fuel: 'Laddhybrid', img: 'https://images.unsplash.com/photo-1619355745428-2c70034639f7?w=800&q=80' },
                { id: 2, brand: 'Volkswagen', model: 'Golf R 2.0 TSI 4Motion', year: 2019, mil: '7 200 mil', gear: 'Automat', price: '349 500 kr', fuel: 'Bensin', img: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80' },
                { id: 3, brand: 'BMW', model: '520d xDrive Touring M-Sport', year: 2020, mil: '8 900 mil', gear: 'Automat', price: '379 900 kr', fuel: 'Diesel', img: 'https://images.unsplash.com/photo-1555353540-64fd8b01a757?w=800&q=80' }
            ]);
        }, 800);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Ladda in Elfsight (Instagram) på ett React-säkert sätt
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://elfsightcdn.com/platform.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('bmg_cookie_consent', 'true');
        setCookieAccepted(true);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Funktion för att räkna ut månadskostnad (Standard: 20% kontant, ca 36 mån)
    const calculateMonthly = (priceString) => {
        const price = parseInt(priceString.replace(/\D/g, ''));
        const monthly = Math.round((price * 0.8) * 0.0125); 
        return `${monthly.toLocaleString('sv-SE')} kr/mån`;
    };

    const faqs = [
        { q: "Tar ni min nuvarande bil i inbyte?", a: "Självklart! Vi värderar din nuvarande bil och drar av beloppet på ditt nya bilköp. Kontakta oss för en kostnadsfri värdering." },
        { q: "Erbjuder ni hemleverans?", a: "Ja, vi kan erbjuda hemleverans över hela Sverige. Kontakta oss för en offert baserat på var du bor." },
        { q: "Hur fungerar motoroptimering?", a: "Vi uppdaterar mjukvaran i bilens motorstyrenhet för att frigöra mer effekt och ofta sänka bränsleförbrukningen. Helt säkert och beprövat." },
        { q: "Kan jag reservera en bil?", a: "Ja, mot en handpenning kan vi reservera en bil åt dig under en överenskommen tid." }
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden">
            
            {/* --- UPPDATERAD NAVBAR MED LOGGA --- */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? 'bg-brand-950/95 backdrop-blur-md shadow-lg py-4 border-b border-white/5' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative z-20">
                    
                    {/* Logotyp och Företagsnamn (Nu svävande och perfekt integrerad!) */}
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={scrollToTop}>
                        <img 
                            src="bmglogo.png" 
                            alt="BMG Motorgrupp Logotyp" 
                            className="h-12 w-12 md:h-14 md:w-14 object-contain drop-shadow-[0_0_12px_rgba(249,115,22,0.15)] transition-transform duration-300 group-hover:scale-105" 
                        />
                        <div className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase hidden sm:block">
                            BMG <span className="text-brand-500 font-light">Motorgrupp</span>
                        </div>
                    </div>
                    
                    {/* Desktop Meny */}
                    <div className="hidden md:flex gap-8 text-sm font-semibold tracking-wide items-center">
                        <a href="#tjanster" className="hover:text-brand-500 transition-colors">Tjänster</a>
                        <a href="#om-oss" className="hover:text-brand-500 transition-colors">Om oss</a>
                        <a href="#recensioner" className="hover:text-brand-500 transition-colors">Omdömen</a>
                        <a href="#kontakt" className="hover:text-brand-500 transition-colors">Kontakt</a>
                        <a href="#lager" className="bg-brand-500 text-white px-5 py-2 rounded-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20">Bilar i lager</a>
                    </div>

                    {/* Mobil Meny Knapp (Hamburger) */}
                    <button 
                        className="md:hidden text-white p-2 hover:text-brand-500 transition-colors" 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Öppna meny"
                    >
                        <window.Icon name={mobileMenuOpen ? "x" : "menu"} size={28} />
                    </button>
                </div>

                {/* Mobil Meny Dropdown */}
                <div className={`md:hidden absolute top-full left-0 w-full bg-brand-950/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col px-6 py-6 gap-6 font-semibold text-lg">
                        <a href="#tjanster" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-brand-500 flex items-center gap-3"><window.Icon name="settings" size={20}/> Tjänster</a>
                        <a href="#om-oss" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-brand-500 flex items-center gap-3"><window.Icon name="info" size={20}/> Om oss</a>
                        <a href="#recensioner" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-brand-500 flex items-center gap-3"><window.Icon name="star" size={20}/> Omdömen</a>
                        <a href="#kontakt" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-brand-500 flex items-center gap-3"><window.Icon name="phone" size={20}/> Kontakt</a>
                        <a href="#lager" onClick={() => setMobileMenuOpen(false)} className="text-brand-500 flex items-center gap-3"><window.Icon name="car" size={20}/> Bilar i lager</a>
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
                            Specialister på begagnade personbilar, lätta motorfordon och fordonsoptimering. Hög kvalitet till konkurrenskraftiga priser i Eslöv.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" 
                               className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg shadow-brand-500/25">
                                <window.Icon name="car" size={20} />
                                Se bilar i lager
                            </a>
                            <a href="#kontakt" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all backdrop-blur-sm">
                                Kontakta oss
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- TRYGGHET BANNER --- */}
            <div className="bg-brand-900 border-y border-white/5 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-around items-center gap-8 opacity-80">
                    <div className="flex items-center gap-3 text-slate-300 font-semibold">
                        <window.Icon name="shield-check" className="text-brand-500" size={32} />
                        <span>Trygga garantier via AutoConcept</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 font-semibold">
                        <window.Icon name="credit-card" className="text-brand-500" size={32} />
                        <span>Smidig finansiering med MyMoney</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 font-semibold">
                        <window.Icon name="check-circle" className="text-brand-500" size={32} />
                        <span>Noggrant testade fordon</span>
                    </div>
                </div>
            </div>

            {/* --- OM OSS --- */}
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
                            <window.Icon name="map-pin" className="text-brand-500" />
                            Varmt välkomna in till oss i Eslöv!
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
                               className="w-full bg-white text-brand-950 py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                                Gå till vår Blocket-butik <window.Icon name="arrow-right" size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TJÄNSTER --- */}
            <section id="tjanster" className="py-24 bg-brand-950 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Våra Tjänster</h2>
                        <p className="text-slate-400 text-lg">Heltäckande lösningar för din nästa bilaffär.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {[
                            { title: 'Köp', icon: 'shopping-cart', desc: 'Hitta din nästa drömbil hos oss. Vi garanterar fordon i toppskick.' },
                            { title: 'Försäljning', icon: 'tag', desc: 'Vi säljer noggrant utvalda och testade fordon med full transparens.' },
                            { title: 'Förmedling', icon: 'handshake', desc: 'Låt oss sälja din bil åt dig. Vi hanterar hela affären tryggt och smidigt.' },
                            { title: 'Inbyten', icon: 'refresh-cw', desc: 'Vi tar självklart emot inbyten! Uppgradera din bil enkelt hos oss.' },
                            { title: 'Motoroptimering', icon: 'zap', desc: 'Maximera prestandan och sänk bränsleförbrukningen med mjukvaruoptimering.' }
                        ].map((service, idx) => (
                            <div key={idx} className="bg-brand-900 border border-white/5 p-6 rounded-2xl hover:border-brand-500/50 transition-colors group">
                                <div className="w-12 h-12 bg-brand-950 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <window.Icon name={service.icon} className="text-brand-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{service.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- KUNDRECENSIONER --- */}
            <section id="recensioner" className="py-24 bg-brand-900 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Vad våra kunder säger</h2>
                        <p className="text-slate-400 text-lg">Kundnöjdhet är vår högsta prioritet.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: 'Johan A.', text: 'En otroligt smidig bilaffär! Bilen var precis i det skick som beskrevs och personalen var mycket tillmötesgående. Rekommenderas starkt!' },
                            { name: 'Amar S.', text: 'Lämnade in min bil för förmedling och BMG Motorgrupp skötte allt galant. Fick ett bättre pris än förväntat och slapp allt krångel.' },
                            { name: 'Mirnel H.', text: 'Gjorde en motoroptimering på min skåpbil och märker en enorm skillnad både i styrka och bränsleförbrukning. Proffsigt rakt igenom.' }
                        ].map((review, idx) => (
                            <div key={idx} className="bg-brand-950 p-8 rounded-2xl border border-white/5 relative">
                                <window.Icon name="quote" className="text-brand-500/20 absolute top-6 right-6" size={48} />
                                <div className="flex text-brand-500 mb-4">
                                    {[...Array(5)].map((_, i) => <window.Icon key={i} name="star" className="fill-brand-500" size={16} />)}
                                </div>
                                <p className="text-slate-300 italic mb-6">"{review.text}"</p>
                                <div className="font-bold text-white">- {review.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FAQ OCH KONTAKT --- */}
            <section id="kontakt" className="py-24 bg-brand-950 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
                    
                    <div>
                        <h2 className="text-3xl font-black text-white mb-6">Kontakta & Hitta oss</h2>
                        <p className="text-slate-400 mb-8 text-lg">
                            Boka gärna tid innan ditt besök för att säkerställa att det fordon du är intresserad utav finns kvar i lager.
                        </p>
                        
                        <div className="space-y-6 mb-12">
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

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                                    <window.Icon name="map-pin" className="text-brand-500" size={20} />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Besöksadress</div>
                                    <div className="text-lg text-white font-semibold">Grävmaskinsvägen 5<br/>241 38 Eslöv</div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-64 bg-slate-800 rounded-xl overflow-hidden mb-12 border border-white/10">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                scrolling="no" 
                                marginHeight="0" 
                                marginWidth="0" 
                                src="https://maps.google.com/maps?q=Gr%C3%A4vmaskinsv%C3%A4gen%205,%20241%2038%20Esl%C3%B6v&t=&z=14&ie=UTF8&iwloc=&output=embed">
                            </iframe>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6">Vanliga frågor</h3>
                            <div className="space-y-4">
                                {faqs.map((faq, idx) => (
                                    <div key={idx} className="border border-white/10 rounded-lg bg-brand-900 overflow-hidden">
                                        <button 
                                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                            className="w-full text-left px-6 py-4 font-semibold text-white flex justify-between items-center focus:outline-none"
                                        >
                                            {faq.q}
                                            <window.Icon name={openFaq === idx ? "chevron-up" : "chevron-down"} className="text-brand-500" size={20} />
                                        </button>
                                        {openFaq === idx && (
                                            <div className="px-6 pb-4 text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-brand-900 p-8 rounded-2xl border border-white/5">
                            <h3 className="text-2xl font-bold text-white mb-6">Skicka ett meddelande</h3>
                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Tack för ditt meddelande! Vi återkopplar så snart vi kan.'); }}>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Namn</label>
                                    <input type="text" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors" placeholder="Ditt namn" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-400 mb-2">Telefon</label>
                                        <input type="tel" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors" placeholder="Ditt telefonnummer" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-400 mb-2">E-post</label>
                                        <input type="email" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors" placeholder="Din e-post" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Meddelande / Regnr</label>
                                    <textarea rows="4" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors" placeholder="Vad kan vi hjälpa dig med? Ange gärna registreringsnummer vid inbyte."></textarea>
                                </div>
                                <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-lg transition-colors flex justify-center items-center gap-2">
                                    <window.Icon name="send" size={18} /> Skicka förfrågan
                                </button>
                            </form>
                        </div>

                        <div className="bg-brand-900 p-8 rounded-2xl border border-white/5">
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
                </div>
            </section>

            {/* --- ELFSIGHT INSTAGRAM-FLÖDET --- */}
            <section className="py-24 bg-brand-950 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                                <window.Icon name="instagram" className="text-brand-500" size={32} />
                                Följ vår vardag
                            </h2>
                            <p className="text-slate-400">Följ @bmg.motorgrupp på Instagram för de senaste bilarna och en titt bakom kulisserna.</p>
                        </div>
                        <a href="https://instagram.com/bmg.motorgrupp" target="_blank" rel="noopener noreferrer" className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap">
                            Följ oss
                        </a>
                    </div>
                    
                    <div className="elfsight-app-bd475f3d-0848-4f19-a61c-394708e42db4" data-elfsight-app-lazy="true"></div>
                    
                </div>
            </section>

            {/* --- UPPDATERAD FOOTER MED LOGGA --- */}
            <footer className="bg-brand-900 py-12 border-t border-white/10 text-center md:text-left text-slate-500 text-sm">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <img src="bmglogo.png" alt="BMG Motorgrupp Logotyp" className="h-12 w-12 object-contain" />
                        <div>
                            <div className="text-xl font-black text-white uppercase tracking-tighter mb-1">BMG Motorgrupp</div>
                            <p>© {new Date().getFullYear()} Alla rättigheter förbehållna.</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <a href="#" aria-label="Facebook" className="w-10 h-10 bg-white/5 hover:bg-brand-500 rounded-full flex items-center justify-center text-white transition-colors">
                            <window.Icon name="facebook" size={20} />
                        </a>
                        <a href="https://instagram.com/bmg.motorgrupp" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 bg-white/5 hover:bg-brand-500 rounded-full flex items-center justify-center text-white transition-colors">
                            <window.Icon name="instagram" size={20} />
                        </a>
                    </div>
                </div>
            </footer>

            <button 
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 w-12 h-12 bg-brand-500 text-white rounded-full shadow-xl shadow-brand-500/30 flex items-center justify-center transition-all duration-300 z-40 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
                aria-label="Skrolla till toppen"
            >
                <window.Icon name="arrow-up" size={24} />
            </button>

            {!cookieAccepted && (
                <div className="fixed bottom-0 left-0 w-full bg-brand-950/95 backdrop-blur-md border-t border-white/10 z-50 p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-full duration-500">
                    <div className="text-slate-300 text-sm md:text-base max-w-4xl">
                        <strong className="text-white block mb-1">Vi värnar om din integritet</strong>
                        Vi använder cookies för att förbättra din upplevelse på webbplatsen, analysera trafik och anpassa innehåll. Genom att surfa vidare godkänner du vår användning av cookies.
                    </div>
                    <div className="flex gap-4 w-full md:w-auto shrink-0">
                        <button onClick={acceptCookies} className="w-full md:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-colors whitespace-nowrap">
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
