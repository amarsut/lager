const { useState, useEffect, useMemo } = React;

window.Icon = ({ name, size = 24, className = "" }) => {
    const iconRef = React.useRef(null);

    useEffect(() => {
        if (window.lucide && iconRef.current) {
            // Rensa gammalt innehåll för att undvika removeChild-fel
            iconRef.current.innerHTML = ''; 
            const i = document.createElement('i');
            i.setAttribute('data-lucide', name);
            i.style.width = `${size}px`;
            i.style.height = `${size}px`;
            if (className) i.className = className;
            iconRef.current.appendChild(i);
            
            try {
                window.lucide.createIcons({ nodes: [i] });
            } catch (e) {
                console.error("Ikonfel:", e);
            }
        }
    }, [name, size, className]);

    // Vi mappar name till key för att React ska rendera om korrekt vid sökning
    return <span ref={iconRef} key={name} className="inline-flex"></span>;
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
    { title: 'Motoroptimering', icon: 'zap', desc: 'Maximera prestandan och sänk bränsleförbrukningen med mjukvaruoptimering.', action: 'optimization' }
];

const reviews = [
    { name: 'Johan A.', text: 'En otroligt smidig bilaffär! Bilen var precis i det skick som beskrevs och personalen var mycket tillmötesgående. Rekommenderas starkt!' },
    { name: 'Amar S.', text: 'Lämnade in min bil för förmedling och BMG Motorgrupp skötte allt galant. Fick ett bättre pris än förväntat och slapp allt krångel.' },
    { name: 'Mirnel H.', text: 'Gjorde en motoroptimering på min skåpbil och märker en enorm skillnad både i styrka och bränsleförbrukning. Proffsigt rakt igenom.' }
];

// --- KRASCHSÄKRA HJÄLPFUNKTIONER ---
const parseNumber = (val) => {
    try {
        if (val === null || val === undefined) return 0;
        const match = String(val).replace(/\D/g, '');
        const num = parseInt(match, 10);
        return isNaN(num) ? 0 : num;
    } catch (e) {
        return 0;
    }
};

const calculateMonthlyCost = (priceStr, downPaymentPercent = 0.2, interest = 0.0795, years = 6) => {
    const price = parseNumber(priceStr);
    if (price <= 0) return "0";
    
    const loanAmount = price * (1 - downPaymentPercent);
    const monthlyInterest = interest / 12;
    const numberOfPayments = years * 12;
    
    const monthlyPayment = (loanAmount * monthlyInterest) / (1 - Math.pow(1 + monthlyInterest, -numberOfPayments));
    
    return Math.round(monthlyPayment).toLocaleString('sv-SE');
};

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
            <div className="h-8 bg-white/10 rounded w-full mt-4"></div>
        </div>
    </div>
);

const CarCard = ({ car, handleShare, setFinanceCar, calculateMonthlyCost }) => {
    const [currentImg, setCurrentImg] = useState(0);
    const [showDesc, setShowDesc] = useState(false); // Nytt state för att visa beskrivningen

    const nextImg = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImg((prev) => (prev === car.images.length - 1 ? 0 : prev + 1));
    };

    const prevImg = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImg((prev) => (prev === 0 ? car.images.length - 1 : prev - 1));
    };

    return (
        <article className="bg-brand-900 rounded-2xl overflow-hidden border border-white/5 hover:border-brand-500/50 transition-all group shadow-xl flex flex-col relative">
            <div className="h-56 overflow-hidden relative bg-brand-950 flex items-center justify-center shrink-0 group/slider">
                <img 
                    src={car.images[currentImg]} 
                    alt={`${car.brand} ${car.model}`} 
                    loading="lazy" 
                    className="w-full h-full object-cover transition-opacity duration-300" 
                    onError={(e) => {e.target.src = "https://images.unsplash.com/photo-1555353540-64fd8b01a757?w=800&q=80"}} 
                />
                
                {car.images.length > 1 && (
                    <>
                        <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-brand-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 z-20">
                            <window.Icon name="chevron-left" size={18} />
                        </button>
                        <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-brand-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 z-20">
                            <window.Icon name="chevron-right" size={18} />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                            {car.images.map((_, idx) => (
                                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${currentImg === idx ? 'bg-brand-500 w-3' : 'bg-white/50'}`} />
                            ))}
                        </div>
                    </>
                )}

                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(car); }} className="absolute top-4 right-4 z-20 w-10 h-10 bg-brand-950/80 backdrop-blur hover:bg-brand-500 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border border-white/10" title="Tipsa en vän">
                    <window.Icon name="share-2" size={18} />
                </button>

                {/* NYA BADGES UPPETILL VÄNSTER */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    {car.regNo && (
                        <div className="bg-white text-black text-[10px] sm:text-xs font-bold px-2 py-1 border border-black/20 rounded shadow-md uppercase tracking-widest w-fit">
                            {car.regNo}
                        </div>
                    )}
                    {car.isEco && (
                        <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-widest w-fit flex items-center gap-1">
                            <window.Icon name="leaf" size={10} /> Miljöbil
                        </div>
                    )}
                    {car.hasWarranty && (
                        <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-widest w-fit flex items-center gap-1">
                            <window.Icon name="shield-check" size={10} /> Garanti
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
                <div className="text-brand-500 text-sm font-bold uppercase tracking-wider mb-1 flex justify-between items-center">
                    <span>{car.brand}</span>
                    {car.carfaxUrl && (
                        <a href={car.carfaxUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            <window.Icon name="file-text" size={12} /> CARFAX
                        </a>
                    )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2" title={car.model}>{car.model}</h3>
                
                {car.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {car.equipment.slice(0, 3).map((item, i) => (
                            <span key={i} className="text-[10px] bg-brand-500/10 text-brand-500 border border-brand-500/20 px-2 py-1 rounded truncate max-w-[120px]" title={item}>{item}</span>
                        ))}
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2"><window.Icon name="calendar" size={16} /> {car.year}</div>
                    <div className="flex items-center gap-2"><window.Icon name="gauge" size={16} /> {car.mil}</div>
                    <div className="flex items-center gap-2"><window.Icon name="settings-2" size={16} /> {car.gear}</div>
                    <div className="flex items-center gap-2"><window.Icon name="fuel" size={16} /> {car.fuel}</div>
                    {car.hp && <div className="flex items-center gap-2"><window.Icon name="zap" size={16} /> {car.hp} hk</div>}
                    {car.passengers && <div className="flex items-center gap-2"><window.Icon name="users" size={16} /> {car.passengers} sits</div>}
                </div>

                {/* NYTT: FÄLL UT BESKRIVNING */}
                {car.description && (
                    <div className="mb-4">
                        <button 
                            onClick={() => setShowDesc(!showDesc)} 
                            className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-1 font-semibold transition-colors"
                        >
                            <window.Icon name={showDesc ? "chevron-up" : "chevron-down"} size={14} />
                            {showDesc ? "Dölj annonstext" : "Läs annonstext"}
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${showDesc ? 'max-h-96 mt-2 opacity-100 overflow-y-auto pr-2 no-scrollbar' : 'max-h-0 opacity-0'}`}>
                            <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed border-l-2 border-brand-500/30 pl-3">
                                {car.description}
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="border-t border-white/10 pt-4 mt-auto">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                Kontantpris
                                {car.showVat && <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded border border-green-500/30">MOMS</span>}
                            </div>
                            {car.discountAmount > 0 && (
                                <div className="text-xs text-red-400 line-through mb-0.5 decoration-red-400/50">
                                    {(car.priceValue + car.discountAmount).toLocaleString('sv-SE')} kr
                                </div>
                            )}
                            <div className="text-2xl font-black text-white flex items-center gap-2">
                                {car.price}
                                {car.discountAmount > 0 && (
                                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                                        -{car.discountAmount.toLocaleString('sv-SE')} kr
                                    </span>
                                )}
                            </div>
                            {car.exVatPrice && <div className="text-[10px] text-slate-400 mt-1">{car.exVatPrice}</div>}
                        </div>
                        <button onClick={(e) => { e.preventDefault(); setFinanceCar(car); }} className="text-right hover:opacity-80 transition-opacity">
                            <div className="text-[11px] font-bold text-brand-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                                Finansiering <window.Icon name="calculator" size={10} />
                            </div>
                            <div className="text-base font-bold text-white">Från {calculateMonthlyCost(car.price)} kr/mån</div>
                        </button>
                    </div>
                    <a href={car.link} target="_blank" rel="noopener noreferrer" className="w-full bg-white/5 hover:bg-brand-500 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                        Se annons på Blocket <window.Icon name="external-link" size={18} />
                    </a>
                </div>
            </div>
        </article>
    );
};

const App = () => {
    const [scrolled, setScrolled] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [cookieAccepted, setCookieAccepted] = useState(true);
    const [openFaq, setOpenFaq] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // MODAL STATE
    const [showOptimizationModal, setShowOptimizationModal] = useState(false);

    const [cars, setCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(true);
    const [apiError, setApiError] = useState(false);
    
    // Filter States
    const [filterBrand, setFilterBrand] = useState("Alla");
    const [filterFuel, setFilterFuel] = useState("Alla");
    const [filterGear, setFilterGear] = useState("Alla");
    const [filterDrive, setFilterDrive] = useState("Alla"); // Alla, 2WD, 4WD
    
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minMil, setMinMil] = useState("");
    const [maxMil, setMaxMil] = useState("");
    const [minYear, setMinYear] = useState("");
    const [maxYear, setMaxYear] = useState("");

    const [equipmentFilters, setEquipmentFilters] = useState({
        dragkrok: false,
        backkamera: false,
        farthallare: false,
        motorvarmare: false,
        panoramatak: false,
        gps: false
    });

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [financeCar, setFinanceCar] = useState(null);
    const [calcDownPayment, setCalcDownPayment] = useState(20);
    const [calcMonths, setCalcMonths] = useState(72);

    // Återställ-funktion för att nollställa allt snabbt
    const resetFilters = () => {
        setSearchTerm(""); setFilterBrand("Alla"); setFilterFuel("Alla"); 
        setFilterGear("Alla"); setFilterDrive("Alla");
        setMinPrice(""); setMaxPrice(""); setMinMil(""); setMaxMil(""); setMinYear(""); setMaxYear("");
        setEquipmentFilters({ dragkrok: false, backkamera: false, farthallare: false, motorvarmare: false, panoramatak: false, gps: false });
    };

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
        if (showOptimizationModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [showOptimizationModal]);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://elfsightcdn.com/platform.js";
        script.async = true;
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    // HÄMTA BILAR VIA API (Felsäker version)
    useEffect(() => {
        const fetchCars = async () => {
            setLoadingCars(true);
            setApiError(false);
            
            try {
                let data; // Skapa en tom variabel för datan
                
                try {
                    // PLAN A: Försök hämta live-data via Netlify (Fungerar när den är uppladdad)
                    const response = await fetch("https://bmgmotorgrupp.netlify.app/.netlify/functions/getCars");
                    if (!response.ok) throw new Error("Netlify-funktionen hittades inte");
                    data = await response.json();
                    console.log("Hämtade LIVE-data via Netlify!");
                    
                } catch (netlifyError) {
                    // PLAN B: Netlify misslyckades (vi är antagligen på localhost eller GitHub). 
                    // Faller tillbaka på din sparade fil bilar.json!
                    console.log("Netlify-funktion ej tillgänglig. Hämtar från bilar.json istället...");
                    
                    const fallbackResponse = await fetch("./bilar.json");
                    if (!fallbackResponse.ok) throw new Error("Hittade ingen bilar.json heller");
                    data = await fallbackResponse.json();
                }

                // --- HÄR FORTSÄTTER DIN VANLIGA KOD ---
                const formattedCars = data.map(car => {
                    console.log("RÅDATA FRÅN BYTBIL LIVE:", car);
                    
                    // Hämta ALLA bilder istället för bara en
                    let imageUrls = ["https://images.unsplash.com/photo-1555353540-64fd8b01a757?w=800&q=80"];
                    if (car.images && car.images.length > 0) {
                        imageUrls = car.images.map(img => {
                            if (img.imageFormats && img.imageFormats.length > 0) {
                                return img.imageFormats[0].url; 
                            }
                            return null;
                        }).filter(url => url !== null);
                    }

                    let fuelName = "Okänd";
                    if (car.fuels && car.fuels.length > 0) {
                        fuelName = car.fuels[0].name;
                    } else if (car.fuel) {
                        fuelName = car.fuel;
                    }

                    return {
                        id: car.id || Math.random(),
                        brand: car.make || "Okänt märke",
                        model: car.modelRaw || car.model || "Modell saknas",
                        year: car.modelYear || "-",
                        mil: car.milage ? `${car.milage.toLocaleString('sv-SE')} mil` : "0 mil",
                        gear: car.gearBox || "Okänd",
                        price: (car.price && car.price.value) ? `${car.price.value.toLocaleString('sv-SE')} kr` : "Ring för pris",
                        fuel: fuelName,
                        images: imageUrls, // <-- HÄR SPARAR VI ARRAYEN
                        regNo: car.regNoHidden ? "*** ***" : (car.regNo || ""),
                        equipment: car.equipment || [],
                        hp: (car.additionalVehicleData && car.additionalVehicleData.engineEffectHp) ? car.additionalVehicleData.engineEffectHp : null,
                        isAWD: (car.additionalVehicleData && car.additionalVehicleData.fourWheelDrive) ? true : false,
                        carfaxUrl: (car.carfaxReport && car.carfaxReport.clickUrl) ? car.carfaxReport.clickUrl : null,
                        description: car.description || "",
                        isEco: car.isEco || false,
                        hasWarranty: car.inWarrantyProgram || false,
                        passengers: car.noPassangers || null,
                        link: "https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" 
                    };
                });

                setCars(formattedCars);
            } catch (error) {
                console.error("API-fel:", error);
                setApiError(true);
            } finally {
                setLoadingCars(false);
            }
        };

        fetchCars();
    }, []);

    // Dela-funktion (Web Share API)
    const handleShare = (car) => {
        const shareData = {
            title: `Kolla in denna ${car.brand} ${car.model}!`,
            text: `Jag hittade denna snygga ${car.brand} ${car.model} (${car.year}, ${car.mil}) för ${car.price} hos BMG Motorgrupp.`,
            url: "https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" 
        };

        if (navigator.share) {
            navigator.share(shareData).catch((error) => console.log('Delning avbruten', error));
        } else {
            navigator.clipboard.writeText(`${shareData.text} Länk: ${shareData.url}`);
            alert("Länk och info har kopierats till urklipp. Klistra in för att skicka till en vän!");
        }
    };

    // KRASCHSÄKER FILTER LOGIK
    // Unika listor för dropdowns
    const uniqueBrands = ["Alla", ...new Set(cars.map(c => c.brand).filter(Boolean))].sort();
    const uniqueFuels = ["Alla", ...new Set(cars.map(c => c.fuel).filter(Boolean))].sort();
    const uniqueGears = ["Alla", ...new Set(cars.map(c => c.gear).filter(Boolean))].sort();

    // KRASCHSÄKER FILTER LOGIK
    const filteredCars = useMemo(() => {
        try {
            let result = [...cars];
            
            // Fritextsökning
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                result = result.filter(c => 
                    c.brand.toLowerCase().includes(term) || 
                    c.model.toLowerCase().includes(term) ||
                    c.regNo.toLowerCase().includes(term) // Lade till sökning på regnr!
                );
            }

            // Dropdowns
            if (filterBrand !== "Alla") result = result.filter(c => c.brand === filterBrand);
            if (filterFuel !== "Alla") result = result.filter(c => c.fuel === filterFuel);
            if (filterGear !== "Alla") result = result.filter(c => c.gear === filterGear);
            
            // Drivning
            if (filterDrive === "4WD") result = result.filter(c => c.isAWD);
            if (filterDrive === "2WD") result = result.filter(c => !c.isAWD);

            // Spann: Pris, Mil, År
            if (minPrice) result = result.filter(c => parseNumber(c.price) >= parseInt(minPrice));
            if (maxPrice) result = result.filter(c => parseNumber(c.price) <= parseInt(maxPrice));
            if (minMil) result = result.filter(c => parseNumber(c.mil) >= parseInt(minMil));
            if (maxMil) result = result.filter(c => parseNumber(c.mil) <= parseInt(maxMil));
            if (minYear) result = result.filter(c => parseNumber(c.year) >= parseInt(minYear));
            if (maxYear) result = result.filter(c => parseNumber(c.year) <= parseInt(maxYear));

            // Utrustning (Söker automatiskt inuti Bytbils equipment-lista)
            if (equipmentFilters.dragkrok) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("dragkrok")));
            if (equipmentFilters.backkamera) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("backkamera") || e.toLowerCase().includes("360")));
            if (equipmentFilters.farthallare) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("farthållare")));
            if (equipmentFilters.motorvarmare) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("värmare")));
            if (equipmentFilters.panoramatak) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("panorama") || e.toLowerCase().includes("glastak")));
            if (equipmentFilters.gps) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("gps") || e.toLowerCase().includes("navigation")));
            
            return result;
        } catch (error) {
            console.error("Filtreringsfel:", error);
            return [];
        }
    }, [cars, searchTerm, filterBrand, filterFuel, filterGear, filterDrive, minPrice, maxPrice, minMil, maxMil, minYear, maxYear, equipmentFilters]);

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
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? 'bg-brand-950/95 backdrop-blur-md shadow-lg py-4 border-b border-white/5' : 'bg-transparent py-6'}`} aria-label="Huvudmeny">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg outline-none" onClick={scrollToTop} tabIndex="0" role="button" aria-label="Gå till toppen">
                        <img 
                            src="bmglogo.png" 
                            alt="BMG Motorgrupp Logotyp" 
                            className="h-12 w-12 md:h-14 md:w-14 object-contain drop-shadow-[0_0_12px_rgba(249,115,22,0.15)] transition-transform duration-300 group-hover:scale-105" 
                        />
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

            <main>
                {/* --- HERO --- */}
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
                                <a href="#lager" 
                                   className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg shadow-brand-500/25 focus-visible:ring-2 focus-visible:ring-white outline-none">
                                    <window.Icon name="car" size={20} />
                                    Se bilar i lager
                                </a>
                                <a href="#kontakt" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-brand-500 outline-none">
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
                            <span>Trygga garantier</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300 font-semibold">
                            <window.Icon name="credit-card" className="text-brand-500" size={32} />
                            <span>Smidig finansiering</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300 font-semibold">
                            <window.Icon name="check-circle" className="text-brand-500" size={32} />
                            <span>Noggrant testade fordon</span>
                        </div>
                    </div>
                </div>

                {/* --- LAGER --- */}
                <section id="lager" className="py-24 bg-brand-950 border-b border-white/5 relative z-10">
                    <div className="max-w-7xl mx-auto px-6">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Vårt utbud just nu</h2>
                                <p className="text-slate-400 text-lg">Här ser du alla fordon vi har i lager, uppdaterat i realtid.</p>
                            </div>
                            <div className="text-brand-500 font-bold bg-brand-500/10 px-4 py-2 rounded-lg border border-brand-500/20">
                                {filteredCars.length} fordon hittades
                            </div>
                        </div>

                        {/* FILTER PANEL */}
                        {cars.length > 0 && !loadingCars && !apiError && (
                            <div className="bg-brand-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-12 shadow-2xl relative overflow-hidden transition-all">
                                {/* Mjuk bakgrundsglöd */}
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 gap-4">
                                    <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tight">
                                        <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center border border-brand-500/30">
                                            <window.Icon name="sliders-horizontal" className="text-brand-500" size={20} />
                                        </div>
                                        Hitta din bil
                                    </div>
                                    <button 
                                        onClick={resetFilters} 
                                        className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5"
                                    >
                                        <window.Icon name="rotate-ccw" size={16} /> Nollställ allt
                                    </button>
                                </div>

                                {/* SÖKFÄLT (Hero-fokus) */}
                                <div className="relative mb-8 z-10 group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <window.Icon name="search" className="text-slate-400 group-focus-within:text-brand-500 transition-colors" size={24} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Sök på modell, märke, regnr eller utrustning..." 
                                        className="w-full bg-brand-950/80 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white text-lg placeholder:text-slate-500 focus:bg-brand-950 focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-inner"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                {/* PRIMÄRA FILTER (Alltid synliga) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10 mb-6">
                                    
                                    {/* Märke */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Märke</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <window.Icon name="car" className="text-slate-500 group-focus-within:text-brand-500 transition-colors" size={18} />
                                            </div>
                                            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="w-full bg-brand-950 border border-white/10 text-white rounded-xl pl-12 pr-10 py-3.5 text-sm md:text-base focus:outline-none focus:border-brand-500 appearance-none font-semibold cursor-pointer transition-colors hover:border-white/20">
                                                <option value="Alla" className="bg-brand-900 text-white">Alla märken</option>
                                                {uniqueBrands.filter(b => b !== "Alla").map(brand => (
                                                    <option key={brand} value={brand} className="bg-brand-900 text-white">{brand}</option>
                                                ))}
                                            </select>
                                            <window.Icon name="chevron-down" size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Pris */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Pris</label>
                                        <div className="flex bg-brand-950 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors focus-within:border-brand-500">
                                            <div className="relative flex-1 border-r border-white/10">
                                                <select value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full bg-transparent text-white pl-4 pr-8 py-3.5 text-sm md:text-base focus:outline-none appearance-none font-semibold cursor-pointer">
                                                    <option value="" className="bg-brand-900 text-white">Från</option>
                                                    <option value="50000" className="bg-brand-900 text-white">50 000 kr</option>
                                                    <option value="100000" className="bg-brand-900 text-white">100 000 kr</option>
                                                    <option value="200000" className="bg-brand-900 text-white">200 000 kr</option>
                                                    <option value="300000" className="bg-brand-900 text-white">300 000 kr</option>
                                                    <option value="500000" className="bg-brand-900 text-white">500 000 kr</option>
                                                </select>
                                                <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            </div>
                                            <div className="relative flex-1">
                                                <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-transparent text-white pl-4 pr-8 py-3.5 text-sm md:text-base focus:outline-none appearance-none font-semibold cursor-pointer">
                                                    <option value="" className="bg-brand-900 text-white">Till</option>
                                                    <option value="100000" className="bg-brand-900 text-white">100 000 kr</option>
                                                    <option value="200000" className="bg-brand-900 text-white">200 000 kr</option>
                                                    <option value="300000" className="bg-brand-900 text-white">300 000 kr</option>
                                                    <option value="500000" className="bg-brand-900 text-white">500 000 kr</option>
                                                    <option value="750000" className="bg-brand-900 text-white">750 000 kr</option>
                                                    <option value="1000000" className="bg-brand-900 text-white">1 000 000 kr</option>
                                                </select>
                                                <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Miltal */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Miltal</label>
                                        <div className="flex bg-brand-950 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors focus-within:border-brand-500">
                                            <div className="relative flex-1 border-r border-white/10">
                                                <select value={minMil} onChange={(e) => setMinMil(e.target.value)} className="w-full bg-transparent text-white pl-4 pr-8 py-3.5 text-sm md:text-base focus:outline-none appearance-none font-semibold cursor-pointer">
                                                    <option value="" className="bg-brand-900 text-white">Från</option>
                                                    <option value="0" className="bg-brand-900 text-white">0 mil</option>
                                                    <option value="5000" className="bg-brand-900 text-white">5 000 mil</option>
                                                    <option value="10000" className="bg-brand-900 text-white">10 000 mil</option>
                                                    <option value="15000" className="bg-brand-900 text-white">15 000 mil</option>
                                                </select>
                                                <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            </div>
                                            <div className="relative flex-1">
                                                <select value={maxMil} onChange={(e) => setMaxMil(e.target.value)} className="w-full bg-transparent text-white pl-4 pr-8 py-3.5 text-sm md:text-base focus:outline-none appearance-none font-semibold cursor-pointer">
                                                    <option value="" className="bg-brand-900 text-white">Till</option>
                                                    <option value="5000" className="bg-brand-900 text-white">5 000 mil</option>
                                                    <option value="10000" className="bg-brand-900 text-white">10 000 mil</option>
                                                    <option value="15000" className="bg-brand-900 text-white">15 000 mil</option>
                                                    <option value="20000" className="bg-brand-900 text-white">20 000 mil</option>
                                                    <option value="30000" className="bg-brand-900 text-white">30 000 mil</option>
                                                </select>
                                                <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TOGGLE-KNAPP AVANCERAT */}
                                <div className="flex justify-center relative z-10">
                                    <button 
                                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                        className="text-sm font-bold text-white transition-all flex items-center gap-2 bg-brand-950 hover:bg-brand-950/80 px-6 py-2.5 rounded-full border border-white/10 hover:border-brand-500/50 group"
                                    >
                                        <window.Icon name="settings-2" size={16} className="text-brand-500 group-hover:rotate-90 transition-transform duration-300" />
                                        {showAdvancedFilters ? "Dölj avancerade val" : "Fler inställningar & Utrustning"}
                                        <window.Icon name={showAdvancedFilters ? "chevron-up" : "chevron-down"} size={16} className="text-slate-500" />
                                    </button>
                                </div>

                                {/* AVANCERADE FILTER (Utfällbara) */}
                                <div className={`transition-all duration-500 ease-in-out relative z-10 overflow-hidden ${showAdvancedFilters ? 'max-h-[1000px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
                                    
                                    <div className="p-6 bg-brand-950/50 rounded-2xl border border-white/5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                            
                                            {/* Årsmodell */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Årsmodell</label>
                                                <div className="flex bg-brand-900 border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-500">
                                                    <div className="relative flex-1 border-r border-white/10">
                                                        <select value={minYear} onChange={(e) => setMinYear(e.target.value)} className="w-full bg-transparent text-slate-300 pl-4 pr-8 py-3 text-sm focus:outline-none appearance-none font-semibold">
                                                            <option value="" className="bg-brand-900 text-white">Från</option>
                                                            {[2010, 2012, 2015, 2018, 2020, 2022, 2024].map(y => <option key={y} value={y} className="bg-brand-900 text-white">{y}</option>)}
                                                        </select>
                                                        <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                    </div>
                                                    <div className="relative flex-1">
                                                        <select value={maxYear} onChange={(e) => setMaxYear(e.target.value)} className="w-full bg-transparent text-slate-300 pl-4 pr-8 py-3 text-sm focus:outline-none appearance-none font-semibold">
                                                            <option value="" className="bg-brand-900 text-white">Till</option>
                                                            {[2015, 2018, 2020, 2022, 2024, 2025].map(y => <option key={y} value={y} className="bg-brand-900 text-white">{y}</option>)}
                                                        </select>
                                                        <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bränsle */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Bränsle</label>
                                                <div className="relative">
                                                    <select value={filterFuel} onChange={(e) => setFilterFuel(e.target.value)} className="w-full bg-brand-900 border border-white/10 text-slate-300 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 appearance-none font-semibold">
                                                        {uniqueFuels.map(f => <option key={f} value={f} className="bg-brand-900 text-white">{f === "Alla" ? "Alla drivmedel" : f}</option>)}
                                                    </select>
                                                    <window.Icon name="chevron-down" size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Växellåda */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Växellåda</label>
                                                <div className="relative">
                                                    <select value={filterGear} onChange={(e) => setFilterGear(e.target.value)} className="w-full bg-brand-900 border border-white/10 text-slate-300 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 appearance-none font-semibold">
                                                        <option value="Alla" className="bg-brand-900 text-white">Alla växellådor</option>
                                                        {uniqueGears.filter(g => g !== "Alla").map(g => <option key={g} value={g} className="bg-brand-900 text-white">{g}</option>)}
                                                    </select>
                                                    <window.Icon name="chevron-down" size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Drivhjul */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Drivhjul</label>
                                                <div className="relative">
                                                    <select value={filterDrive} onChange={(e) => setFilterDrive(e.target.value)} className="w-full bg-brand-900 border border-white/10 text-slate-300 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 appearance-none font-semibold">
                                                        <option value="Alla" className="bg-brand-900 text-white">All drivning</option>
                                                        <option value="4WD" className="bg-brand-900 text-white">Fyrhjulsdrift (AWD)</option>
                                                        <option value="2WD" className="bg-brand-900 text-white">Tvåhjulsdrift (2WD)</option>
                                                    </select>
                                                    <window.Icon name="chevron-down" size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* UTRUSTNINGS-TAGGAR */}
                                        <div>
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
                                                <window.Icon name="check-square" size={14} /> Viktig utrustning
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                                {Object.keys(equipmentFilters).map(key => {
                                                    const labels = { dragkrok: "Dragkrok", backkamera: "Backkamera / 360", farthallare: "Farthållare", motorvarmare: "Motor/Kupévärmare", panoramatak: "Panoramatak", gps: "Navigation / GPS" };
                                                    const isActive = equipmentFilters[key];
                                                    return (
                                                        <button 
                                                            key={key}
                                                            onClick={() => setEquipmentFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                                                isActive 
                                                                ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] ring-1 ring-brand-500 scale-[1.02]' 
                                                                : 'bg-brand-900 text-slate-400 border border-white/5 hover:border-white/20 hover:text-white hover:bg-brand-800'
                                                            }`}
                                                        >
                                                            {isActive && <window.Icon name="check" size={14} />}
                                                            {labels[key]}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loadingCars ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3].map(i => <CarSkeleton key={i} />)}
                            </div>
                        ) : apiError ? (
                            <div className="text-center py-12 bg-brand-900/50 rounded-xl border border-white/5">
                                <window.Icon name="alert-circle" className="text-brand-500 mx-auto mb-4" size={48} />
                                <h3 className="text-xl font-bold text-white mb-2">Vi uppdaterar lagret!</h3>
                                <p className="text-slate-400 mb-6">Just nu kan vi inte hämta bilarna hit till hemsidan, men du hittar hela vårt utbud direkt på Blocket.</p>
                                <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-600 transition-colors">
                                    Gå till Blocket-butiken <window.Icon name="external-link" size={18} />
                                </a>
                            </div>
                        ) : filteredCars.length === 0 ? (
                            <div className="text-center py-16 bg-brand-900/50 rounded-2xl border border-white/5">
                                {/* Använd en fast sträng som key för ikonen här så den inte renderas om i onödan */}
                                <window.Icon key="no-search-results" name="search" className="text-slate-500 mx-auto mb-4" size={48} />
                                <h3 className="text-xl font-bold text-white mb-2">Inga fordon hittades</h3>
                                <p className="text-slate-400 mb-6">Vi hittade tyvärr inga bilar som matchar dina sökval.</p>
                                <button 
                                    onClick={() => { setSearchTerm(""); setFilterBrand("Alla"); setFilterFuel("Alla"); setMaxPrice(1000000); setMaxMil(30000); }}
                                    className="text-brand-500 font-bold hover:text-white transition-colors underline underline-offset-4"
                                >
                                    Återställ alla filter
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredCars.map(car => (
                                    <CarCard 
                                        key={car.id} 
                                        car={car} 
                                        handleShare={handleShare} 
                                        setFinanceCar={setFinanceCar} 
                                        calculateMonthlyCost={calculateMonthlyCost} 
                                    />
                                ))}
                            </div>
                        )}
                        
                        {(cars.length > 0 || loadingCars) && (
                            <div className="mt-12 flex justify-center">
                                <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" 
                                   className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 outline-none">
                                    Se hela butiken på Blocket <window.Icon name="external-link" size={18} />
                                </a>
                            </div>
                        )}
                    </div>
                </section>

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
                                   className="w-full bg-white text-brand-950 py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 outline-none">
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
                            {services.map((service, idx) => {
                                const isClickable = service.action === 'optimization';
                                return (
                                    <article 
                                        key={idx} 
                                        onClick={isClickable ? () => setShowOptimizationModal(true) : undefined}
                                        className={`bg-brand-900 border p-6 rounded-2xl transition-all group relative overflow-hidden
                                            ${isClickable 
                                                ? 'border-brand-500/30 cursor-pointer hover:border-brand-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-brand-500/10 hover:ring-brand-500/50 hover:-translate-y-1' 
                                                : 'border-white/5 hover:border-brand-500/50'
                                            }`}
                                    >
                                        {isClickable && (
                                            <div className="absolute top-4 right-4 bg-brand-500/10 text-brand-500 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                                Läs mer <window.Icon name="arrow-right" size={12} />
                                            </div>
                                        )}

                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-transform group-hover:scale-110 
                                            ${isClickable ? 'bg-brand-500/20 text-brand-500' : 'bg-brand-950 text-brand-500'}`}>
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

                {/* --- FAQ OCH KONTAKT --- */}
                <section id="kontakt" className="py-24 bg-brand-950 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
                        
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

                {/* --- ELFSIGHT INSTAGRAM-FLÖDET --- */}
                <section className="py-24 bg-brand-950 border-t border-white/5 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                            <div>
                                <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                                    <window.Icon name="instagram" className="text-brand-500" size={32} />
                                    Följ vår vardag
                                </h2>
                                <p className="text-slate-400">Följ @bmg.motorgrupp på Instagram för de senaste bilarna och en titt bakom kulisserna.</p>
                            </div>
                            <a href="https://instagram.com/bmg.motorgrupp" target="_blank" rel="noopener noreferrer" className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white outline-none">
                                Följ oss
                            </a>
                        </div>
                        
                        <div className="elfsight-app-bd475f3d-0848-4f19-a61c-394708e42db4" data-elfsight-app-lazy="true"></div>
                        
                    </div>
                </section>
            </main>

            {/* --- FOOTER --- */}
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
            <div className="fixed bottom-8 right-6 md:right-8 flex flex-col gap-3 z-40">
                <button 
                    onClick={scrollToTop}
                    className={`w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand-500 outline-none ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}
                    aria-label="Skrolla till toppen"
                >
                    <window.Icon name="arrow-up" size={24} />
                </button>
                
                <a 
                    href="tel:0733447449"
                    className="md:hidden w-12 h-12 bg-brand-500 text-white rounded-full shadow-xl shadow-brand-500/30 flex items-center justify-center transition-transform active:scale-95"
                    aria-label="Ring oss"
                >
                    <window.Icon name="phone" size={20} />
                </a>
            </div>

            {/* --- MODAL FÖR MOTOROPTIMERING V3 (MOBILOPTIMERAD) --- */}
            {showOptimizationModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0 bg-brand-950/80 backdrop-blur-sm cursor-pointer"
                        onClick={() => setShowOptimizationModal(false)}
                        aria-label="Stäng fönster"
                    ></div>
                    
                    <div className="relative bg-brand-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setShowOptimizationModal(false)}
                            className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/40 backdrop-blur-md hover:bg-brand-500 text-white rounded-full flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white shadow-lg"
                        >
                            <window.Icon name="x" size={18} />
                        </button>

                        <div className="overflow-y-auto no-scrollbar flex-1 w-full">
                            <div className="bg-gradient-to-br from-brand-950 to-brand-900 border-b border-white/5 p-6 sm:p-8 pr-14 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 blur-3xl rounded-full"></div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-3 relative z-10">
                                    Dynex Performance
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight relative z-10 mb-2">
                                    Frigör bilens <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-orange-300">dolda kraft</span>
                                </h3>
                                <p className="text-slate-300 text-sm md:text-base relative z-10 max-w-lg leading-relaxed">
                                    Biltillverkarna stryper ofta motorerna från fabrik. Vi låser upp potentialen helt utan mekaniska ingrepp.
                                </p>
                            </div>

                            <div className="p-6 sm:p-8 space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                        <window.Icon name="zap" className="text-brand-500 mx-auto mb-2" size={24} />
                                        <div className="font-bold text-white mb-1">Mer Hästkrafter</div>
                                        <div className="text-xs text-slate-400">Snabbare & roligare</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                        <window.Icon name="gauge" className="text-brand-500 mx-auto mb-2" size={24} />
                                        <div className="font-bold text-white mb-1">Ökat Vridmoment</div>
                                        <div className="text-xs text-slate-400">Säkrare omkörningar</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                        <window.Icon name="fuel" className="text-brand-500 mx-auto mb-2" size={24} />
                                        <div className="font-bold text-white mb-1">Lägre Förbrukning</div>
                                        <div className="text-xs text-slate-400">Upp till 10% besparing</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <window.Icon name="trending-up" className="text-brand-500" size={18} />
                                        Typiska resultat (Före ➔ Efter)
                                    </h4>
                                    <div className="bg-brand-950 rounded-xl border border-white/5 overflow-hidden">
                                        <div className="flex justify-between items-center p-3 border-b border-white/5 text-sm">
                                            <span className="text-slate-300 font-semibold">BMW 520d</span>
                                            <span className="text-brand-500 font-bold">190 hk ➔ 235 hk</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 border-b border-white/5 text-sm bg-white/[0.02]">
                                            <span className="text-slate-300 font-semibold">Audi A6 40 TDI</span>
                                            <span className="text-brand-500 font-bold">204 hk ➔ 245 hk</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 text-sm">
                                            <span className="text-slate-300 font-semibold">VW Golf 1.4 TSI</span>
                                            <span className="text-brand-500 font-bold">150 hk ➔ 180 hk</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-5 flex gap-4">
                                    <window.Icon name="shield-check" className="text-brand-500 shrink-0" size={24} />
                                    <div>
                                        <h4 className="text-white font-bold mb-1 text-sm">100% Säkert & Beprövat</h4>
                                        <p className="text-xs text-brand-100/80 leading-relaxed">
                                            Mjukvaran från Dynex Performance skräddarsys för din motor. Bilens inbyggda säkerhetsmarginaler behålls alltid intakta.
                                        </p>
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
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const btn = e.target.querySelector('button');
                                        btn.innerHTML = 'Förfrågan skickad!';
                                        btn.classList.add('bg-green-600', 'hover:bg-green-700');
                                        setTimeout(() => setShowOptimizationModal(false), 2000);
                                    }}
                                >
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Regnr (T.ex. ABC 123)" 
                                        className="flex-1 bg-brand-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm uppercase placeholder:normal-case font-bold" 
                                    />
                                    <input 
                                        type="tel" 
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

            {/* --- MODAL: LÅNEKALKYLATOR --- */}
            {financeCar && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-brand-950/90 backdrop-blur-md" onClick={() => setFinanceCar(null)}></div>
                    <div className="relative bg-brand-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-brand-950">
                            <h3 className="text-xl font-black text-white">Lånekalkylator</h3>
                            <button onClick={() => setFinanceCar(null)} className="text-slate-400 hover:text-white"><window.Icon name="x" /></button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div>
                                <div className="text-brand-500 font-bold mb-1 uppercase text-xs">{financeCar.brand}</div>
                                <div className="text-2xl font-black text-white">{financeCar.model}</div>
                                <div className="text-slate-400">Pris: {financeCar.price}</div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-bold text-white">
                                        <span>Kontantinsats ({calcDownPayment}%)</span>
                                        <span className="text-brand-500">{Math.round(parseNumber(financeCar.price) * (calcDownPayment/100)).toLocaleString('sv-SE')} kr</span>
                                    </div>
                                    <input type="range" min="20" max="100" value={calcDownPayment} onChange={(e) => setCalcDownPayment(e.target.value)} className="w-full accent-brand-500 h-2 bg-brand-950 rounded-lg appearance-none cursor-pointer" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-bold text-white">
                                        <span>Löptid</span>
                                        <span className="text-brand-500">{calcMonths} månader</span>
                                    </div>
                                    <input type="range" min="12" max="84" step="12" value={calcMonths} onChange={(e) => setCalcMonths(e.target.value)} className="w-full accent-brand-500 h-2 bg-brand-950 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            </div>

                            <div className="bg-brand-950 p-6 rounded-xl border border-brand-500/20 text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Beräknad månadskostnad</div>
                                {/* Här kan du använda en förbättrad calculateFinance-funktion om du vill */}
                                <div className="text-4xl font-black text-brand-500">
                                    {Math.round((parseNumber(financeCar.price) * (1 - calcDownPayment/100)) * (0.0795/12) / (1 - Math.pow(1 + 0.0795/12, -calcMonths))).toLocaleString('sv-SE')} kr
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
