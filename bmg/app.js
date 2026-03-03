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
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [cookieAccepted, setCookieAccepted] = useState(true);
    const [showOptimizationModal, setShowOptimizationModal] = useState(false);
    const [financeCar, setFinanceCar] = useState(null);

    // Hantera Scroll för "Till Toppen"-knappen
    useEffect(() => {
        const consent = localStorage.getItem('bmg_cookie_consent');
        if (!consent) setCookieAccepted(false);

        let timeoutId;
        const handleScroll = () => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                setShowScrollTop(window.scrollY > 500);
                timeoutId = null;
            }, 100); 
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Lås bakgrunden när modal är öppen
    useEffect(() => {
        document.body.style.overflow = showOptimizationModal ? 'hidden' : 'unset';
    }, [showOptimizationModal]);

    // Ladda in Instagram-flödet (ElfSight)
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://elfsightcdn.com/platform.js";
        script.async = true;
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);    

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden">
            
            <Navbar />
            
            <main>
                <HeroSection />
                <LagerSection setFinanceCar={setFinanceCar} />
                <AboutSection />
                <ServicesSection setShowOptimizationModal={setShowOptimizationModal} />
                <ReviewsSection />
                <ContactSection />
                
                {/* Instagram Flöde */}
                <section className="py-24 bg-brand-950 border-t border-white/5 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                            <div>
                                <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                                    <window.Icon name="instagram" className="text-brand-500" size={32} /> Följ vår vardag
                                </h2>
                                <p className="text-slate-400">Följ @bmg.motorgrupp på Instagram för de senaste bilarna och en titt bakom kulisserna.</p>
                            </div>
                            <a href="https://instagram.com/bmg.motorgrupp" target="_blank" rel="noopener noreferrer" className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-white outline-none">
                                Följ oss
                            </a>
                        </div>
                        <div className="elfsight-app-bd475f3d-0848-4f19-a61c-394708e42db4" data-elfsight-app-lazy="true"></div>
                    </div>
                </section>
            </main>

            <Footer />

            {/* Fasta knappar */}
            <div className="fixed bottom-8 right-6 md:right-8 flex flex-col gap-3 z-40">
                <button 
                    onClick={scrollToTop}
                    className={`w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 outline-none ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}
                >
                    <window.Icon name="arrow-up" size={24} />
                </button>
                <a href="tel:0733447449" className="md:hidden w-12 h-12 bg-brand-500 text-white rounded-full shadow-xl flex items-center justify-center transition-transform active:scale-95">
                    <window.Icon name="phone" size={20} />
                </a>
            </div>

            {/* Modaler & Cookies */}
            {showOptimizationModal && <OptimizationModal setShowOptimizationModal={setShowOptimizationModal} />}
            {financeCar && <FinanceModal financeCar={financeCar} setFinanceCar={setFinanceCar} />}
            
            {!cookieAccepted && (
                <div className="fixed bottom-0 left-0 w-full bg-brand-950/95 backdrop-blur-md border-t border-white/10 z-50 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-full duration-500">
                    <div className="text-slate-300 text-sm md:text-base max-w-4xl">
                        <strong className="text-white block mb-1">Vi värnar om din integritet</strong>
                        Vi använder cookies för att förbättra din upplevelse.
                    </div>
                    <button onClick={() => { localStorage.setItem('bmg_cookie_consent', 'true'); setCookieAccepted(true); }} className="px-6 py-3 bg-brand-500 text-white font-bold rounded-lg hover:bg-brand-600">
                        Jag godkänner
                    </button>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
