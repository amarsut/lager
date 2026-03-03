const { useState, useEffect } = React;

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? 'bg-brand-950/95 backdrop-blur-md shadow-lg py-4 border-b border-white/5' : 'bg-transparent py-6'}`} aria-label="Huvudmeny">
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg outline-none" onClick={scrollToTop} tabIndex="0" role="button" aria-label="Gå till toppen">
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

                <button 
                    className="md:hidden text-white p-2 hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none" 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-expanded={mobileMenuOpen}
                    aria-label={mobileMenuOpen ? "Stäng meny" : "Öppna meny"}
                >
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
    );
};
window.Navbar = Navbar;
