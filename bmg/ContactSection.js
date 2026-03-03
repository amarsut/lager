const { useState } = React;

const ContactSection = () => {
    // Vi flyttar in detta state hit, så slipper app.js tänka på det!
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <section id="kontakt" className="py-24 bg-brand-950 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
                
                {/* Vänster kolumn: Kontaktinfo & Karta & FAQ */}
                <div>
                    <h2 className="text-3xl font-black text-white mb-6">Kontakta & Hitta oss</h2>
                    <p className="text-slate-400 mb-8 text-lg">
                        Boka gärna tid innan ditt besök för att säkerställa att det fordon du är intresserad utav finns kvar i lager.
                    </p>
                    
                    <address className="space-y-6 mb-12 not-italic">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                                <window.Icon name="phone" className="text-brand-500" size={20} />
                            </div>
                            <div>
                                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Telefon / SMS</div>
                                <a href="tel:0733447449" className="text-xl text-white font-bold hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none inline-block">073-34 47 449</a>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                                <window.Icon name="mail" className="text-brand-500" size={20} />
                            </div>
                            <div>
                                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">E-postadress</div>
                                <a href="mailto:info@bmotorgrupp.se" className="text-xl text-white font-bold hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none inline-block">info@bmotorgrupp.se</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                                <window.Icon name="map-pin" className="text-brand-500" size={20} />
                            </div>
                            <div>
                                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Besöksadress</div>
                                <a href="https://maps.google.com/?q=Grävmaskinsvägen+5,24138+Eslöv" target="_blank" rel="noopener noreferrer" className="text-lg text-white font-semibold hover:text-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded outline-none inline-block">
                                    Grävmaskinsvägen 5<br/>241 38 Eslöv
                                </a>
                            </div>
                        </div>
                    </address>

                    <div className="w-full h-64 bg-slate-800 rounded-xl overflow-hidden mb-12 border border-white/10">
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
                        <h3 className="text-2xl font-bold text-white mb-6">Vanliga frågor</h3>
                        <div className="space-y-4">
                            {/* faqs laddas in automatiskt från din data.js! */}
                            {faqs.map((faq, idx) => (
                                <div key={idx} className="border border-white/10 rounded-lg bg-brand-900 overflow-hidden">
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                        aria-expanded={openFaq === idx}
                                        className="w-full text-left px-6 py-4 font-semibold text-white flex justify-between items-center focus-visible:bg-white/5 outline-none transition-colors"
                                    >
                                        {faq.q}
                                        <window.Icon name={openFaq === idx ? "chevron-up" : "chevron-down"} className="text-brand-500 shrink-0 ml-4" size={20} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-6 pb-4 text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                                            {faq.a}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Höger kolumn: Formulär & Öppettider */}
                <div className="space-y-8">
                    <div className="bg-brand-900 p-8 rounded-2xl border border-white/5 shadow-xl">
                        <h3 className="text-2xl font-bold text-white mb-6">Skicka ett meddelande</h3>
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
                                <label htmlFor="name" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Namn</label>
                                <input type="text" id="name" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" placeholder="Ditt namn" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Telefon</label>
                                    <input type="tel" id="phone" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" placeholder="Ditt telefonnummer" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">E-post</label>
                                    <input type="email" id="email" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" placeholder="Din e-post" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Meddelande / Regnr</label>
                                <textarea id="message" rows="4" required className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-y" placeholder="Vad kan vi hjälpa dig med? Ange gärna registreringsnummer vid inbyte."></textarea>
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-semibold text-slate-400 mb-2 cursor-pointer">Vad gäller det?</label>
                                <div className="relative">
                                    <select 
                                        id="subject" 
                                        name="subject"
                                        required 
                                        defaultValue=""
                                        className="w-full bg-brand-950 border border-white/10 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Välj ämne...</option>
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

                    <div className="bg-brand-900 p-8 rounded-2xl border border-white/5 shadow-xl">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-6">
                            <window.Icon name="clock" className="text-brand-500" size={24} />
                            <h3 className="text-2xl font-bold text-white">Öppettider</h3>
                        </div>
                        
                        <ul className="space-y-5 text-lg">
                            <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-300 gap-2">
                                <span>Måndag – Fredag</span>
                                <span className="font-bold text-white text-xl">11:00 – 18:00</span>
                            </li>
                            
                            <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-300 gap-3 border-t border-white/5 pt-5">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span>Lördag – Söndag</span>
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-500/20 w-fit">
                                        <window.Icon name="clock" size={14} />
                                        Endast tidsbokning
                                    </span>
                                </div>
                                <span className="font-bold text-white text-xl">11:00 – 15:00</span>
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
    );
};

// Gör den tillgänglig för app.js
window.ContactSection = ContactSection;
