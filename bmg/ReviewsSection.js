const ReviewsSection = () => {
    return (
        <section id="recensioner" className="py-24 bg-brand-900 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Vad våra kunder säger</h2>
                    <p className="text-slate-400 text-lg">Kundnöjdhet är vår högsta prioritet.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* reviews hämtas automatiskt från data.js */}
                    {reviews.map((review, idx) => (
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
    );
};

// Gör den global
window.ReviewsSection = ReviewsSection;
