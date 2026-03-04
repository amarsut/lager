const { useState, useEffect } = React;

window.Icon = ({ name, size = 24, className = "" }) => {
    const iconRef = React.useRef(null);
    useEffect(() => {
        if (window.lucide && iconRef.current) {
            iconRef.current.innerHTML = ''; 
            const i = document.createElement('i');
            i.setAttribute('data-lucide', name);
            i.style.width = `${size}px`;
            i.style.height = `${size}px`;
            if (className) i.className = className;
            iconRef.current.appendChild(i);
            try { window.lucide.createIcons({ nodes: [i] }); } catch (e) { console.error(e); }
        }
    }, [name, size, className]);
    return <span ref={iconRef} key={name} className="inline-flex"></span>;
};

const App = () => {
    const [scrolled, setScrolled] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [cookieAccepted, setCookieAccepted] = useState(true);
    const [openFaq, setOpenFaq] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showOptimizationModal, setShowOptimizationModal] = useState(false);
    const [financeCar, setFinanceCar] = useState(null);

    // --- CMS STATE ---
    const [cmsData, setCmsData] = useState(null);

    // --- HÄMTA DATA FRÅN FIREBASE & UPPDATERA SEO ---
    useEffect(() => {
        const fetchCmsData = async () => {
            try {
                const response = await fetch("https://firestore.googleapis.com/v1/projects/bmg-motorgrupp/databases/(default)/documents/site_settings/main");
                if (!response.ok) throw new Error("Kunde inte nå databasen");
                const json = await response.json();
                
                if (json.fields) {
                    const data = {
                        heroBadge: json.fields.heroBadge?.stringValue || "",
                        heroBg: json.fields.heroBg?.stringValue || "",
                        heroTitle1: json.fields.heroTitle1?.stringValue || "",
                        heroTitle2: json.fields.heroTitle2?.stringValue || "",
                        heroSubtitle: json.fields.heroSubtitle?.stringValue || "",
                        aboutText: json.fields.aboutText?.stringValue || "",
                        metaTitle: json.fields.metaTitle?.stringValue || "",
                        metaDesc: json.fields.metaDesc?.stringValue || "",
                        phone: json.fields.phone?.stringValue || "",
                        email: json.fields.email?.stringValue || "",
                        address: json.fields.address?.stringValue || "",
                        hoursWeek: json.fields.hoursWeek?.stringValue || "",
                        hoursWeekend: json.fields.hoursWeekend?.stringValue || "",
                        instagram: json.fields.instagram?.stringValue || "",
                        facebook: json.fields.facebook?.stringValue || "",
                        faqs: json.fields.faqs?.arrayValue?.values?.map(v => ({
                            q: v.mapValue?.fields?.q?.stringValue || "",
                            a: v.mapValue?.fields?.a?.stringValue || ""
                        })) || []
                    };
                    
                    setCmsData(data);

                    // --- SEO MAGIN SKER HÄR ---
                    // 1. Ändra flikens namn (Meta Title)
                    if (data.metaTitle) {
                        document.title = data.metaTitle;
                    }
                    
                    // 2. Ändra Googles beskrivning (Meta Description)
                    if (data.metaDesc) {
                        let metaDescTag = document.querySelector('meta[name="description"]');
                        if (!metaDescTag) {
                            metaDescTag = document.createElement('meta');
                            metaDescTag.name = "description";
                            document.head.appendChild(metaDescTag);
                        }
                        metaDescTag.content = data.metaDesc;
                    }
                }
            } catch (error) {
                console.error("Kunde inte hämta CMS-data:", error);
            }
        };
        fetchCmsData();
    }, []);

    // --- SCROLL & COOKIES ---
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

    // --- LÅS SCROLL VID MODAL ---
    useEffect(() => {
        if (showOptimizationModal) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
    }, [showOptimizationModal]);

    // --- INSTAGRAM ELFSIGHT SCRIPT ---
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://elfsightcdn.com/platform.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, []);    

    const acceptCookies = () => {
        localStorage.setItem('bmg_cookie_consent', 'true');
        setCookieAccepted(true);
    };

    const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };

    // Standard FAQ som fallback om databasen är tom (hämtar från din data.js om den finns)
    const displayFaqs = cmsData?.faqs?.length > 0 ? cmsData.faqs : (typeof faqs !== 'undefined' ? faqs : []);

    return (
        <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden">
            
            {/* --- NAVBAR --- */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? 'bg-brand-950/95 backdrop-blur-md shadow-lg py-4 border-b border-white/5' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg outline-none" onClick={scrollToTop} tabIndex="0" role="button">
                        <img src="bmglogo.png" alt="BMG Motorgrupp Logotyp" className="h-12 w-12 md:h-14 md:w-14 object-contain drop-shadow-[0_0_12px_rgba(249,115,22,0.15)] transition-transform duration-300 group-hover:scale-105" />
                        <div className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase hidden sm:block">
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

                    <button className="md:hidden text-white p-2 hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <window.Icon name={mobileMenuOpen ? "x" : "menu"} size={28} />
                    </button>
                </div>

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

            <main>
                {/* --- HERO --- */}
                <header 
                    className="hero-bg min-h-screen flex items-center pt-20 bg-cover bg-center transition-all duration-700"
                    style={cmsData?.heroBg ? { backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.6), rgba(2, 6, 23, 1)), url('${cmsData.heroBg}')` } : {}}
                >
                    <div className="max-w-7xl mx-auto px-6 w-full">
                        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-sm font-bold tracking-widest uppercase mb-6">
                                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span> 
                                {cmsData?.heroBadge || "Kvalitet & Transparens"}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                                {cmsData?.heroTitle1 || "Din partner för"} <br /> 
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-orange-300">
                                    {cmsData?.heroTitle2 || "Rätt Fordon"}
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-xl whitespace-pre-wrap">
                                {cmsData?.heroSubtitle || "Specialister på begagnade personbilar, lätta motorfordon och fordonsoptimering. Hög kvalitet till konkurrenskraftiga priser i Eslöv."}
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

                {/* --- TRYGGHETS BANNER --- */}
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

                {/* --- LAGER (Nu inbakad från din LagerSection-kod) --- */}
                {typeof window.LagerSection !== 'undefined' ? <window.LagerSection setFinanceCar={setFinanceCar} /> : <LagerSection setFinanceCar={setFinanceCar} />}

                {/* --- OM OSS --- */}
                <section id="om-oss" className="py-24 bg-brand-900">
                    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">Vår Affärsidé</h2>
                            <div className="w-20 h-1 bg-brand-500 mb-8 rounded-full"></div>
                            <p className="text-slate-300 text-lg leading-relaxed mb-8 whitespace-pre-wrap">
                                {cmsData?.aboutText || "Vi är en bilhandlare som är specialiserade på försäljning av begagnade personbilar och lätta motorfordon. Vår affärsidé bygger på att erbjuda fordon av hög kvalitet till konkurrenskraftiga priser.\n\nVi prioriterar transparens och strävar efter att alltid leverera en förstklassig kundupplevelse från första kontakt till nycklarna i handen."}
                            </p>
                            <div className="text-xl font-bold text-white flex items-center gap-3">
                                <window.Icon name="map-pin" className="text-brand-500" /> Varmt välkomna in till oss!
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
                                <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" className="w-full bg-white text-brand-950 py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 outline-none">
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
                            {typeof services !== 'undefined' && services.map((service, idx) => {
                                const isClickable = service.action === 'optimization';
                                return (
                                    <article key={idx} onClick={isClickable ? () => setShowOptimizationModal(true) : undefined} className={`bg-brand-900 border p-6 rounded-2xl transition-all group relative overflow-hidden ${isClickable ? 'border-brand-500/30 cursor-pointer hover:border-brand-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-brand-500/10 hover:ring-brand-500/50 hover:-translate-y-1' : 'border-white/5 hover:border-brand-500/50'}`}>
                                        {isClickable && (
                                            <div className="absolute top-4 right-4 bg-brand-500/10 text-brand-500 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                                Läs mer <window.Icon name="arrow-right" size={12} />
                                            </div>
                                        )}
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${isClickable ? 'bg-brand-500/20 text-brand-500' : 'bg-brand-950 text-brand-500'}`}>
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

                {/* --- KUNDRECENSIONER --- */}
                <section id="recensioner" className="py-24 bg-brand-900 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Vad våra kunder säger</h2>
                            <p className="text-slate-400 text-lg">Kundnöjdhet är vår högsta prioritet.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {typeof reviews !== 'undefined' && reviews.map((review, idx) => (
                                <blockquote key={idx} className="bg-brand-950 p-8 rounded-2xl border border-white/5 relative">
                                    <window.Icon name="quote" className="text-brand-500/20 absolute top-6 right-6" size={48} />
                                    <div className="flex text-brand-500 mb-4" aria-label="5 av 5 stjärnor">
                                        {[...Array(5)].map((_, i) => <window.Icon key={i} name="star" className="fill-brand-500" size={16} />)}
                                    </div>
                                    <p className="text-slate-300 italic mb-6">"{review.text}"</p>
                                    <footer className="font-bold text-white">- {review.name}</footer>
                                </blockquote>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- FAQ OCH KONTAKT --- */}
                <section id="kontakt" className="py-24 bg-brand-950 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-6">Kontakta & Hitta oss</h2>
                            <p className="text-slate-400 mb-8 text-lg">Boka gärna tid innan ditt besök för att säkerställa att det fordon du är intresserad utav finns kvar i lager.</p>
                            <address className="space-y-6 mb-12 not-italic">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0"><window.Icon name="phone" className="text-brand-500" size={20} /></div>
                                    <div>
                                        <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Telefon / SMS</div>
                                        <a href={`tel:${cmsData?.phone?.replace(/\s/g, '') || "0733447449"}`} className="text-xl text-white font-bold hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none inline-block">
                                            {cmsData?.phone || "073-34 47 449"}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0"><window.Icon name="mail" className="text-brand-500" size={20} /></div>
                                    <div>
                                        <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">E-postadress</div>
                                        <a href={`mailto:${cmsData?.email || "info@bmotorgrupp.se"}`} className="text-xl text-white font-bold hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none inline-block">
                                            {cmsData?.email || "info@bmotorgrupp.se"}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0"><window.Icon name="map-pin" className="text-brand-500" size={20} /></div>
                                    <div>
                                        <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Besöksadress</div>
                                        <a href="https://maps.google.com/?q=Grävmaskinsvägen+5,24138+Eslöv" target="_blank" rel="noopener noreferrer" className="text-lg text-white font-semibold hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none inline-block whitespace-pre-wrap">
                                            {cmsData?.address || "Grävmaskinsvägen 5\n241 38 Eslöv"}
                                        </a>
                                    </div>
                                </div>
                            </address>

                            {/* KARTAN ÄR TILLBAKA HÄR */}
                            <div className="w-full h-64 bg-slate-800 rounded-xl overflow-hidden mb-12 border border-white/10">
                                <iframe title="Karta över BMG Motorgrupp" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2240.767635749234!2d13.325103476624808!3d55.83199237311359!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x465394ce6c2b9e21%3A0x65cbd9f60f6e7072!2zR3LDpHZtYXNraW5zdsOkZ2VuIDUsIDI0MSAzOCBFc2zDtnY!5e0!3m2!1ssv!2sse!4v1772320405490!5m2!1ssv!2sse" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-white mb-6">Vanliga frågor</h3>
                                <div className="space-y-4">
                                    {displayFaqs.map((faq, idx) => (
                                        <div key={idx} className="border border-white/10 rounded-lg bg-brand-900 overflow-hidden">
                                            <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full text-left px-6 py-4 font-semibold text-white flex justify-between items-center focus-visible:bg-white/5 outline-none transition-colors">
                                                {faq.q} <window.Icon name={openFaq === idx ? "chevron-up" : "chevron-down"} className="text-brand-500 shrink-0 ml-4" size={20} />
                                            </button>
                                            <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <div className="px-6 pb-4 text-slate-400 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-brand-900 p-8 rounded-2xl border border-white/5 shadow-xl">
                                <h3 className="text-2xl font-bold text-white mb-6">Skicka ett meddelande</h3>
                                
                                {/* DITT WEB3FORMS FORMULÄR */}
                                <form className="space-y-4" onSubmit={async (e) => { 
                                    e.preventDefault(); 
                                    const form = e.target;
                                    const btn = form.querySelector('button');
                                    const oldText = btn.innerHTML;
                                    
                                    btn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Skickar...';
                                    btn.disabled = true;

                                    const formData = new FormData(form);

                                    try {
                                        // 1. SKICKA TILL E-POST (WEB3FORMS)
                                        formData.append("access_key", "54199101-e397-49aa-8af2-83c0b2bec430");
                                        const mailResponse = await fetch("https://api.web3forms.com/submit", { 
                                            method: "POST", 
                                            body: formData 
                                        });

                                        if (!mailResponse.ok) {
                                            throw new Error("Kunde inte skicka mejl via Web3Forms");
                                        }

                                        // 2. SKICKA TILL DATABASEN / CRM (FIREBASE)
                                        // Vi använder Firebase REST API här för att slippa krångel med initialisering
                                        const firestoreBody = {
                                            fields: {
                                                name: { stringValue: formData.get("name") || "" },
                                                phone: { stringValue: formData.get("phone") || "" },
                                                email: { stringValue: formData.get("email") || "" },
                                                message: { stringValue: formData.get("message") || "" },
                                                subject: { stringValue: formData.get("subject") || "Övrig fråga" },
                                                status: { stringValue: "new" },
                                                notes: { stringValue: "" },
                                                createdAt: { timestampValue: new Date().toISOString() }
                                            }
                                        };

                                        const dbResponse = await fetch("https://firestore.googleapis.com/v1/projects/bmg-motorgrupp/databases/(default)/documents/leads", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(firestoreBody)
                                        });

                                        if (!dbResponse.ok) {
                                            throw new Error("Kunde inte spara lead till databasen");
                                        }

                                        // ALLT LYCKADES!
                                        btn.innerHTML = 'Skickat! Vi hör av oss.';
                                        btn.classList.add('bg-green-600', 'hover:bg-green-700');
                                        form.reset();
                                        
                                        setTimeout(() => { 
                                            btn.innerHTML = oldText; 
                                            btn.classList.remove('bg-green-600', 'hover:bg-green-700'); 
                                            btn.disabled = false;
                                        }, 4000);
                                        
                                    } catch (error) {
                                        console.error(error);
                                        alert("Ett fel uppstod. Kontrollera din uppkoppling och försök igen.");
                                        btn.innerHTML = oldText;
                                        btn.disabled = false;
                                    }
                                }}>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Namn</label>
                                        <input type="text" id="name" name="name" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" placeholder="Ditt namn" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Telefon</label>
                                            <input type="tel" id="phone" name="phone" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" placeholder="Ditt telefonnummer" />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">E-post</label>
                                            <input type="email" id="email" name="email" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" placeholder="Din e-post" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Meddelande / Regnr</label>
                                        <textarea id="message" name="message" rows="4" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-y" placeholder="Vad kan vi hjälpa dig med? Ange gärna registreringsnummer vid inbyte."></textarea>
                                    </div>
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Vad gäller det?</label>
                                        <div className="relative">
                                            <select id="subject" name="subject" required className="w-full bg-brand-950 border border-white/10 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all appearance-none cursor-pointer">
                                                <option value="" disabled selected>Välj ämne...</option>
                                                <option value="Köp/Inbyte av bil">Köp / Sälj / Inbyte av bil</option>
                                                <option value="Motoroptimering">Motoroptimering</option>
                                                <option value="Övrig fråga">Övrig fråga</option>
                                            </select>
                                            <window.Icon name="chevron-down" size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-lg transition-all hover:scale-[1.02] flex justify-center items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-white">
                                        <window.Icon name="send" size={18} /> Skicka förfrågan
                                    </button>
                                </form>
                            </div>

                            {/* ÖPPETTIDERNA ÄR HELT TILLBAKA MED DESIGNEN */}
                            <div className="bg-brand-900 p-8 rounded-2xl border border-white/5 shadow-xl">
                                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-6">
                                    <window.Icon name="clock" className="text-brand-500" size={24} />
                                    <h3 className="text-2xl font-bold text-white">Öppettider</h3>
                                </div>
                                <ul className="space-y-5 text-lg">
                                    <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-300 gap-2">
                                        <span>Måndag – Fredag</span>
                                        <span className="font-bold text-white text-xl">{cmsData?.hoursWeek || "11:00 – 18:00"}</span>
                                    </li>
                                    <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-300 gap-3 border-t border-white/5 pt-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                            <span>Lördag – Söndag</span>
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-500/20 w-fit">
                                                <window.Icon name="clock" size={14} /> Endast tidsbokning
                                            </span>
                                        </div>
                                        <span className="font-bold text-white text-xl">{cmsData?.hoursWeekend || "11:00 – 15:00"}</span>
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

                {/* --- INSTAGRAM (TILLBAKA) --- */}
                <section className="py-24 bg-brand-950 border-t border-white/5 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                            <div>
                                <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                                    <window.Icon name="instagram" className="text-brand-500" size={32} /> Följ vår vardag
                                </h2>
                                <p className="text-slate-400">Följ @bmg.motorgrupp på Instagram för de senaste bilarna och en titt bakom kulisserna.</p>
                            </div>
                            <a href={cmsData?.instagram || "https://instagram.com/bmg.motorgrupp"} target="_blank" rel="noopener noreferrer" className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white outline-none">
                                Följ oss
                            </a>
                        </div>
                        <div className="elfsight-app-bd475f3d-0848-4f19-a61c-394708e42db4" data-elfsight-app-lazy="true"></div>
                    </div>
                </section>

            </main>

            {/* --- FOOTER (MED AS LOGGA) --- */}
            <footer className="bg-brand-900 py-12 border-t border-white/10 text-center md:text-left text-slate-500 text-sm">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                        <img src="bmglogo.png" alt="BMG Motorgrupp Logotyp" className="h-12 w-12 object-contain" loading="lazy" />
                        <div className="flex flex-col items-center md:items-start">
                            <div className="text-xl font-black text-white uppercase tracking-tighter mb-1">BMG Motorgrupp</div>
                            <p className="mb-4">© {new Date().getFullYear()} Alla rättigheter förbehållna.</p>
                            <a href="https://amarsut.github.io/lager/AS/" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none">
                                <img src="as.jpg" alt="Byggd av AS" className="h-8 object-contain rounded-sm" loading="lazy" />
                            </a>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <a href={cmsData?.facebook || "#"} aria-label="Besök vår Facebook-sida" className="w-10 h-10 bg-white/5 hover:bg-brand-500 rounded-full flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none"><window.Icon name="facebook" size={20} /></a>
                        <a href={cmsData?.instagram || "https://instagram.com/bmg.motorgrupp"} target="_blank" rel="noopener noreferrer" aria-label="Besök vår Instagram-sida" className="w-10 h-10 bg-white/5 hover:bg-brand-500 rounded-full flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none"><window.Icon name="instagram" size={20} /></a>
                    </div>
                </div>
            </footer>

            {/* --- FASTA KNAPPAR --- */}
            <div className="fixed bottom-8 right-6 md:right-8 flex flex-col gap-3 z-40">
                <button onClick={scrollToTop} className={`w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand-500 outline-none ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`} aria-label="Skrolla till toppen">
                    <window.Icon name="arrow-up" size={24} />
                </button>
                <a href={`tel:${cmsData?.phone?.replace(/\s/g, '') || "0733447449"}`} className="md:hidden w-12 h-12 bg-brand-500 text-white rounded-full shadow-xl shadow-brand-500/30 flex items-center justify-center transition-transform active:scale-95" aria-label="Ring oss">
                    <window.Icon name="phone" size={20} />
                </a>
            </div>

            {/* --- MODALER --- */}
            {showOptimizationModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-brand-950/80 backdrop-blur-sm cursor-pointer" onClick={() => setShowOptimizationModal(false)}></div>
                    <div className="relative bg-brand-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowOptimizationModal(false)} className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/40 backdrop-blur-md hover:bg-brand-500 text-white rounded-full flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white shadow-lg"><window.Icon name="x" size={18} /></button>
                        <div className="overflow-y-auto no-scrollbar flex-1 w-full">
                            <div className="bg-gradient-to-br from-brand-950 to-brand-900 border-b border-white/5 p-6 sm:p-8 pr-14 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 blur-3xl rounded-full"></div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-3 relative z-10">Dynex Performance</div>
                                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight relative z-10 mb-2">Frigör bilens <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-orange-300">dolda kraft</span></h3>
                                <p className="text-slate-300 text-sm md:text-base relative z-10 max-w-lg leading-relaxed">Biltillverkarna stryper ofta motorerna från fabrik. Vi låser upp potentialen helt utan mekaniska ingrepp.</p>
                            </div>
                            <div className="p-6 sm:p-8 space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center"><window.Icon name="zap" className="text-brand-500 mx-auto mb-2" size={24} /><div className="font-bold text-white mb-1">Mer Hästkrafter</div><div className="text-xs text-slate-400">Snabbare & roligare</div></div>
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center"><window.Icon name="gauge" className="text-brand-500 mx-auto mb-2" size={24} /><div className="font-bold text-white mb-1">Ökat Vridmoment</div><div className="text-xs text-slate-400">Säkrare omkörningar</div></div>
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center"><window.Icon name="fuel" className="text-brand-500 mx-auto mb-2" size={24} /><div className="font-bold text-white mb-1">Lägre Förbrukning</div><div className="text-xs text-slate-400">Upp till 10% besparing</div></div>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-4 flex items-center gap-2"><window.Icon name="trending-up" className="text-brand-500" size={18} /> Typiska resultat (Före ➔ Efter)</h4>
                                    <div className="bg-brand-950 rounded-xl border border-white/5 overflow-hidden">
                                        <div className="flex justify-between items-center p-3 border-b border-white/5 text-sm"><span className="text-slate-300 font-semibold">BMW 520d</span><span className="text-brand-500 font-bold">190 hk ➔ 235 hk</span></div>
                                        <div className="flex justify-between items-center p-3 border-b border-white/5 text-sm bg-white/[0.02]"><span className="text-slate-300 font-semibold">Audi A6 40 TDI</span><span className="text-brand-500 font-bold">204 hk ➔ 245 hk</span></div>
                                        <div className="flex justify-between items-center p-3 text-sm"><span className="text-slate-300 font-semibold">VW Golf 1.4 TSI</span><span className="text-brand-500 font-bold">150 hk ➔ 180 hk</span></div>
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
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const form = e.target;
                                        const btn = form.querySelector('button');
                                        const oldText = btn.innerHTML;
                                        
                                        btn.innerHTML = 'Skickar...';
                                        btn.disabled = true;

                                        const formData = new FormData(form);
                                        const regnr = formData.get("regnr");
                                        const phone = formData.get("phone");

                                        try {
                                            // 1. Skicka mejl via Web3Forms
                                            formData.append("access_key", "54199101-e397-49aa-8af2-83c0b2bec430");
                                            formData.append("subject", `Optimering: ${regnr}`);
                                            
                                            await fetch("https://api.web3forms.com/submit", {
                                                method: "POST",
                                                body: formData
                                            });

                                            // 2. Skicka till Firebase (Leads)
                                            const firestoreBody = {
                                                fields: {
                                                    name: { stringValue: "Kund (Optimering)" },
                                                    phone: { stringValue: phone },
                                                    message: { stringValue: `Intresseanmälan motoroptimering. Regnr: ${regnr}` },
                                                    subject: { stringValue: `Optimering: ${regnr}` },
                                                    status: { stringValue: "new" },
                                                    createdAt: { timestampValue: new Date().toISOString() }
                                                }
                                            };

                                            await fetch("https://firestore.googleapis.com/v1/projects/bmg-motorgrupp/databases/(default)/documents/leads", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify(firestoreBody)
                                            });

                                            // 3. Framgång
                                            btn.innerHTML = 'Förfrågan skickad!';
                                            btn.classList.add('bg-green-600', 'hover:bg-green-700');
                                            setTimeout(() => setShowOptimizationModal(false), 2000);

                                        } catch (error) {
                                            console.error(error);
                                            alert("Något gick fel, försök igen.");
                                            btn.disabled = false;
                                            btn.innerHTML = oldText;
                                        }
                                    }}
                                >
                                    <input 
                                        type="text" 
                                        name="regnr"
                                        required 
                                        placeholder="Regnr (T.ex. ABC 123)" 
                                        className="flex-1 bg-brand-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm uppercase placeholder:normal-case font-bold" 
                                    />
                                    <input 
                                        type="tel" 
                                        name="phone"
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
            )}

            {typeof window.FinanceModal !== 'undefined' && financeCar && <window.FinanceModal financeCar={financeCar} setFinanceCar={setFinanceCar} />}

            {!cookieAccepted && (
                <div className="fixed bottom-0 left-0 w-full bg-brand-950/95 backdrop-blur-md border-t border-white/10 z-[9999] p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-full duration-500">
                    <div className="text-slate-300 text-sm md:text-base max-w-4xl">
                        <strong className="text-white block mb-1">Vi värnar om din integritet</strong>
                        Vi använder cookies för att förbättra din upplevelse på webbplatsen, analysera trafik och anpassa innehåll. Genom att surfa vidare godkänner du vår användning av cookies.
                    </div>
                    <div className="flex gap-4 w-full md:w-auto shrink-0">
                        <button onClick={acceptCookies} className="w-full md:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white outline-none">Jag godkänner</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
