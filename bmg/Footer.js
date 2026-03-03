const Footer = () => {
    return (
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
                        <a href="https://www.facebook.com/p/BMG-Motorgrupp-AB-61577388170909/" aria-label="Besök vår Facebook-sida" className="w-10 h-10 bg-white/5 hover:bg-brand-500 rounded-full flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none">
                            <window.Icon name="facebook" size={20} />
                        </a>
                        <a href="https://instagram.com/bmg.motorgrupp" target="_blank" rel="noopener noreferrer" aria-label="Besök vår Instagram-sida" className="w-10 h-10 bg-white/5 hover:bg-brand-500 rounded-full flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none">
                            <window.Icon name="instagram" size={20} />
                        </a>
                    </div>
                </div>
            </footer>
    );
};
window.Footer = Footer;
